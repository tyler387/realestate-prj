package com.realestate.collect;

import com.fasterxml.jackson.databind.JsonNode;
import com.realestate.domain.entity.Apartment;
import com.realestate.domain.entity.RealTrade;
import com.realestate.domain.entity.TradeType;
import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.service.CollectionIssueService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiConsumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealTradeCollector {

    private static final String TRADE_API_PATH = "/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
    private static final String RENT_API_PATH = "/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";
    private static final String SEOUL = "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC";
    private static final String APARTMENT_SUFFIX = "\uC544\uD30C\uD2B8";
    private static final DateTimeFormatter DEAL_YMD_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    private final WebClient webClient;
    private final ApartmentRepository apartmentRepository;
    private final RealTradeRepository realTradeRepository;
    private final CollectionIssueService collectionIssueService;

    @Value("${external.public-data.service-key}")
    private String publicDataServiceKey;

    private static final Map<String, CollectTarget> SUPPORTED_DISTRICTS = Map.of(
            "11650", new CollectTarget("11650", SEOUL, "\uC11C\uCD08\uAD6C"),
            "11710", new CollectTarget("11710", SEOUL, "\uC1A1\uD30C\uAD6C"),
            "11680", new CollectTarget("11680", SEOUL, "\uAC15\uB0A8\uAD6C"),
            "11440", new CollectTarget("11440", SEOUL, "\uB9C8\uD3EC\uAD6C"),
            "41111", new CollectTarget("41111", "\uACBD\uAE30\uB3C4", "\uC218\uC6D0\uC2DC \uC7A5\uC548\uAD6C")
    );

    public Map<String, Integer> collectDistrict(String lawdCd, int months) {
        return collectDistrict(lawdCd, months, null);
    }

    public Map<String, Integer> collectDistrict(String lawdCd, int months, BiConsumer<String, Map<String, Integer>> progressCallback) {
        CollectTarget target = SUPPORTED_DISTRICTS.get(lawdCd);
        if (target == null) throw new IllegalArgumentException("Unsupported lawdCd: " + lawdCd);

        Map<String, Integer> stats = initStats();
        YearMonth current = YearMonth.now();
        for (int offset = 0; offset < months; offset++) {
            String dealYmd = current.minusMonths(offset).format(DEAL_YMD_FORMATTER);
            reportProgress(progressCallback, "Collecting trades " + target.sigungu() + " " + dealYmd, stats);
            collectMonthByDistrict(target, dealYmd, stats);
            collectRentMonthByDistrict(target, dealYmd, stats);
            reportProgress(progressCallback, "Collected trades " + target.sigungu() + " " + dealYmd, stats);
        }
        return stats;
    }

    public Map<String, Integer> collectAllDistricts(int months) {
        return collectAllDistricts(months, null);
    }

    public Map<String, Integer> collectAllDistricts(int months, BiConsumer<String, Map<String, Integer>> progressCallback) {
        Map<String, Integer> stats = initStats();
        YearMonth current = YearMonth.now();
        for (int offset = 0; offset < months; offset++) {
            String dealYmd = current.minusMonths(offset).format(DEAL_YMD_FORMATTER);
            for (CollectTarget target : SUPPORTED_DISTRICTS.values()) {
                reportProgress(progressCallback, "Collecting trades " + target.sigungu() + " " + dealYmd, stats);
                collectMonthByDistrict(target, dealYmd, stats);
                collectRentMonthByDistrict(target, dealYmd, stats);
                reportProgress(progressCallback, "Collected trades " + target.sigungu() + " " + dealYmd, stats);
            }
        }
        return stats;
    }

    private void collectMonthByDistrict(CollectTarget target, String dealYmd, Map<String, Integer> stats) {
        collectPagedApi(target, dealYmd, stats, TRADE_API_PATH, "REAL_TRADE", this::saveSingleTrade);
    }

    private void collectRentMonthByDistrict(CollectTarget target, String dealYmd, Map<String, Integer> stats) {
        collectPagedApi(target, dealYmd, stats, RENT_API_PATH, "REAL_RENT", this::saveSingleRent);
    }

    private void collectPagedApi(
            CollectTarget target,
            String dealYmd,
            Map<String, Integer> stats,
            String apiPath,
            String sourceType,
            TradeItemSaver saver
    ) {
        final int numOfRows = 1000;
        int pageNo = 1;
        int totalFetched = 0;
        int totalCount = 0;

        do {
            final int currentPage = pageNo;
            JsonNode response;
            try {
                response = webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .scheme("https").host("apis.data.go.kr").path(apiPath)
                                .queryParam("serviceKey", publicDataServiceKey)
                                .queryParam("LAWD_CD", target.lawdCd())
                                .queryParam("DEAL_YMD", dealYmd)
                                .queryParam("numOfRows", numOfRows)
                                .queryParam("pageNo", currentPage)
                                .queryParam("_type", "json")
                                .build())
                        .retrieve()
                        .bodyToMono(JsonNode.class)
                        .block();
            } catch (Exception e) {
                log.error("Collection API call failed. sourceType={}, sigungu={}, dealYmd={}, page={}: {}",
                        sourceType, target.sigungu(), dealYmd, currentPage, e.getMessage());
                collectionIssueService.recordIssue(
                        sourceType,
                        "API_ERROR",
                        target.sigungu(),
                        null,
                        null,
                        target.lawdCd(),
                        dealYmd,
                        null,
                        "API call failed on page " + currentPage + ": " + e.getMessage()
                );
                break;
            }

            JsonNode body = response == null ? null : response.path("response").path("body");
            totalCount = body == null ? 0 : body.path("totalCount").asInt(0);
            if (currentPage == 1) {
                stats.merge("totalCount", totalCount, Integer::sum);
            }

            JsonNode itemNode = extractItemNode(response);
            if (itemNode == null || itemNode.isMissingNode() || itemNode.isNull()) break;

            int pageItemCount = 0;
            if (itemNode.isArray()) {
                for (JsonNode node : itemNode) {
                    saver.save(node, target, dealYmd, stats);
                    pageItemCount++;
                }
            } else {
                saver.save(itemNode, target, dealYmd, stats);
                pageItemCount = 1;
            }

            totalFetched += pageItemCount;
            stats.merge("processedCount", pageItemCount, Integer::sum);
            pageNo++;
            if (pageItemCount < numOfRows) break;
        } while (totalFetched < totalCount);
    }

    private void saveSingleTrade(JsonNode item, CollectTarget target, String dealYmd, Map<String, Integer> stats) {
        String aptNm = text(item, "aptNm");
        if (aptNm == null || aptNm.isBlank()) return;

        String umdNm = text(item, "umdNm");
        Optional<Apartment> found = resolveApartment(aptNm, umdNm, target.sigungu());
        if (found.isEmpty()) {
            log.warn("Apartment match not found. sigungu={}, umdNm={}, aptNm={}", target.sigungu(), umdNm, aptNm);
            stats.computeIfPresent("skippedNoApartment", (k, v) -> v + 1);
            collectionIssueService.recordIssue(
                    "REAL_TRADE",
                    "NO_APARTMENT_MATCH",
                    target.sigungu(),
                    umdNm,
                    aptNm,
                    target.lawdCd(),
                    dealYmd,
                    item,
                    "No apartment matched for trade item"
            );
            return;
        }

        Integer tradeYear = intValue(item, "dealYear");
        Integer tradeMonth = intValue(item, "dealMonth");
        Integer tradeDay = intValue(item, "dealDay");
        if (tradeYear == null || tradeMonth == null || tradeDay == null) {
            collectionIssueService.recordIssue(
                    "REAL_TRADE",
                    "INVALID_TRADE_DATE",
                    target.sigungu(),
                    umdNm,
                    aptNm,
                    target.lawdCd(),
                    dealYmd,
                    item,
                    "Missing trade date fields"
            );
            return;
        }

        LocalDate tradeDate;
        try {
            tradeDate = LocalDate.of(tradeYear, tradeMonth, tradeDay);
        } catch (RuntimeException e) {
            log.warn("Trade date parsing failed. year={}, month={}, day={}, aptNm={}", tradeYear, tradeMonth, tradeDay, aptNm);
            collectionIssueService.recordIssue(
                    "REAL_TRADE",
                    "INVALID_TRADE_DATE",
                    target.sigungu(),
                    umdNm,
                    aptNm,
                    target.lawdCd(),
                    dealYmd,
                    item,
                    "Invalid trade date: " + tradeYear + "-" + tradeMonth + "-" + tradeDay
            );
            return;
        }

        RealTrade trade = RealTrade.create(
                found.get(),
                TradeType.SALE,
                tradeDate,
                tradeYear,
                tradeMonth,
                decimalValue(item, "excluUseAr"),
                parseTradeAmount(text(item, "dealAmount")),
                intValue(item, "floor"),
                false
        );

        try {
            realTradeRepository.saveAndFlush(trade);
            stats.computeIfPresent("savedTrades", (k, v) -> v + 1);
        } catch (DataIntegrityViolationException e) {
            stats.computeIfPresent("duplicateTrades", (k, v) -> v + 1);
        }
    }

    private void saveSingleRent(JsonNode item, CollectTarget target, String dealYmd, Map<String, Integer> stats) {
        String aptNm = text(item, "aptNm");
        if (aptNm == null || aptNm.isBlank()) return;

        String umdNm = text(item, "umdNm");
        Optional<Apartment> found = resolveApartment(aptNm, umdNm, target.sigungu());
        if (found.isEmpty()) {
            log.warn("Apartment match not found for rent. sigungu={}, umdNm={}, aptNm={}", target.sigungu(), umdNm, aptNm);
            stats.computeIfPresent("skippedNoApartment", (k, v) -> v + 1);
            collectionIssueService.recordIssue(
                    "REAL_RENT",
                    "NO_APARTMENT_MATCH",
                    target.sigungu(),
                    umdNm,
                    aptNm,
                    target.lawdCd(),
                    dealYmd,
                    item,
                    "No apartment matched for rent item"
            );
            return;
        }

        Integer tradeYear = intValue(item, "dealYear");
        Integer tradeMonth = intValue(item, "dealMonth");
        Integer tradeDay = intValue(item, "dealDay");
        if (tradeYear == null || tradeMonth == null || tradeDay == null) {
            collectionIssueService.recordIssue(
                    "REAL_RENT",
                    "INVALID_TRADE_DATE",
                    target.sigungu(),
                    umdNm,
                    aptNm,
                    target.lawdCd(),
                    dealYmd,
                    item,
                    "Missing rent contract date fields"
            );
            return;
        }

        LocalDate tradeDate;
        try {
            tradeDate = LocalDate.of(tradeYear, tradeMonth, tradeDay);
        } catch (RuntimeException e) {
            collectionIssueService.recordIssue(
                    "REAL_RENT",
                    "INVALID_TRADE_DATE",
                    target.sigungu(),
                    umdNm,
                    aptNm,
                    target.lawdCd(),
                    dealYmd,
                    item,
                    "Invalid rent contract date: " + tradeYear + "-" + tradeMonth + "-" + tradeDay
            );
            return;
        }

        Long depositAmount = parseTradeAmount(text(item, "deposit"));
        Long monthlyRentAmount = parseTradeAmount(text(item, "monthlyRent"));
        if (depositAmount == null) {
            collectionIssueService.recordIssue(
                    "REAL_RENT",
                    "INVALID_AMOUNT",
                    target.sigungu(),
                    umdNm,
                    aptNm,
                    target.lawdCd(),
                    dealYmd,
                    item,
                    "Missing rent deposit amount"
            );
            return;
        }

        TradeType tradeType = monthlyRentAmount != null && monthlyRentAmount > 0 ? TradeType.MONTHLY : TradeType.LEASE;
        RealTrade trade = RealTrade.createRent(
                found.get(),
                tradeType,
                tradeDate,
                tradeYear,
                tradeMonth,
                decimalValue(item, "excluUseAr"),
                depositAmount,
                monthlyRentAmount,
                intValue(item, "floor"),
                false
        );

        try {
            realTradeRepository.saveAndFlush(trade);
            stats.computeIfPresent(tradeType == TradeType.LEASE ? "savedLeases" : "savedMonthlyRents", (k, v) -> v + 1);
        } catch (DataIntegrityViolationException e) {
            stats.computeIfPresent("duplicateRents", (k, v) -> v + 1);
        }
    }

    private Optional<Apartment> resolveApartment(String aptNm, String umdNm, String sigungu) {
        if (umdNm != null) {
            Optional<Apartment> found = apartmentRepository.findFirstByComplexNameAndEupMyeonDong(aptNm, umdNm);
            if (found.isPresent()) return found;

            found = apartmentRepository.findFirstByComplexNameAndEupMyeonDong(aptNm + APARTMENT_SUFFIX, umdNm);
            if (found.isPresent()) return found;
        }

        Optional<Apartment> found = apartmentRepository.findFirstByComplexNameAndSigungu(aptNm, sigungu);
        if (found.isPresent()) return found;

        return apartmentRepository.findFirstByComplexNameAndSigungu(aptNm + APARTMENT_SUFFIX, sigungu);
    }

    private JsonNode extractItemNode(JsonNode response) {
        if (response == null) return null;
        return response.path("response").path("body").path("items").path("item");
    }

    private Map<String, Integer> initStats() {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("savedTrades", 0);
        stats.put("savedLeases", 0);
        stats.put("savedMonthlyRents", 0);
        stats.put("skippedNoApartment", 0);
        stats.put("duplicateTrades", 0);
        stats.put("duplicateRents", 0);
        return stats;
    }

    private void reportProgress(BiConsumer<String, Map<String, Integer>> progressCallback, String message, Map<String, Integer> stats) {
        if (progressCallback != null) {
            progressCallback.accept(message, Map.copyOf(stats));
        }
    }

    private String text(JsonNode node, String field) {
        if (node == null || node.path(field).isMissingNode()) return null;
        String value = node.path(field).asText(null);
        return value == null ? null : value.trim();
    }

    private Integer intValue(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) return null;
        try {
            return Integer.parseInt(value.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal decimalValue(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value.replace(",", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long parseTradeAmount(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Long.parseLong(raw.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private record CollectTarget(String lawdCd, String sido, String sigungu) {}

    @FunctionalInterface
    private interface TradeItemSaver {
        void save(JsonNode item, CollectTarget target, String dealYmd, Map<String, Integer> stats);
    }
}
