package com.realestate.collect;

import com.fasterxml.jackson.databind.JsonNode;
import com.realestate.domain.entity.Apartment;
import com.realestate.domain.entity.RealTrade;
import com.realestate.domain.entity.TradeType;
import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.domain.repository.RealTradeRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * 국토교통부 아파트 매매 실거래가 수집기.
 *
 * <p>사용 API: getRTMSDataSvcAptTrade (매매 전용)
 * 전세·월세는 getRTMSDataSvcAptRent API가 별도로 존재하며 현재 미수집.
 *
 * <p>수집 순서: apartment 테이블에 단지 마스터가 먼저 적재된 후 실행해야
 * apartment_id 연결이 가능합니다.
 *
 * <p>단지 매칭 전략 (aptNm 기준):
 * 두 API의 단지명 형식이 다를 수 있으므로 아래 순서로 fallback 매칭합니다.
 * 1. aptNm + umdNm(법정동) — 가장 정확
 * 2. aptNm + "아파트" + umdNm — 단지목록 API가 "아파트" 접미사를 붙이는 경우
 * 3. aptNm + sigungu — 법정동 불일치 fallback
 * 4. aptNm + "아파트" + sigungu — 최후 fallback
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RealTradeCollector {

    private static final String TRADE_API_PATH = "/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
    private static final String SEOUL = "서울특별시";
    private static final DateTimeFormatter DEAL_YMD_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    private final WebClient webClient;
    private final ApartmentRepository apartmentRepository;
    private final RealTradeRepository realTradeRepository;

    @Value("${external.public-data.service-key}")
    private String publicDataServiceKey;

    /**
     * 지원 지역 목록 (시군구코드 → 수집 대상 정보).
     * 새 지역 추가 시 ApartmentComplexCollector.DISTRICTS에도 동일하게 추가해야 합니다.
     */
    private static final Map<String, CollectTarget> SUPPORTED_DISTRICTS = Map.of(
        "11650", new CollectTarget("11650", SEOUL, "서초구"),
        "11710", new CollectTarget("11710", SEOUL, "송파구"),
        "11680", new CollectTarget("11680", SEOUL, "강남구"),
        "11440", new CollectTarget("11440", SEOUL, "마포구"),
        "41111", new CollectTarget("41111", "경기도", "수원시 장안구")
    );

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * 특정 지역의 실거래가를 지정 개월 수만큼 수집합니다.
     * 엔드포인트: POST /api/v1/admin/collect/{lawdCd}?months=N
     *
     * @param lawdCd 법정동코드 앞 5자리 (예: 11710=송파구)
     * @param months 수집 개월 수 (1~12)
     */
    public Map<String, Integer> collectDistrict(String lawdCd, int months) {
        CollectTarget target = SUPPORTED_DISTRICTS.get(lawdCd);
        if (target == null) throw new IllegalArgumentException("Unsupported lawdCd: " + lawdCd);

        Map<String, Integer> stats = initStats();
        YearMonth current = YearMonth.now();
        for (int offset = 0; offset < months; offset++) {
            String dealYmd = current.minusMonths(offset).format(DEAL_YMD_FORMATTER);
            collectMonthByDistrict(target, dealYmd, stats);
        }
        return stats;
    }

    /**
     * 전체 지원 지역의 실거래가를 지정 개월 수만큼 수집합니다.
     * 엔드포인트: POST /api/v1/admin/collect
     *
     * @param months 수집 개월 수 (기본 12)
     */
    public Map<String, Integer> collectAllDistricts(int months) {
        Map<String, Integer> stats = initStats();
        YearMonth current = YearMonth.now();
        for (int offset = 0; offset < months; offset++) {
            String dealYmd = current.minusMonths(offset).format(DEAL_YMD_FORMATTER);
            for (CollectTarget target : SUPPORTED_DISTRICTS.values()) {
                collectMonthByDistrict(target, dealYmd, stats);
            }
        }
        return stats;
    }

    // -----------------------------------------------------------------------
    // 수집 내부 로직
    // -----------------------------------------------------------------------

    /** 특정 지역·월의 거래를 페이지네이션으로 전부 수집합니다. */
    private void collectMonthByDistrict(CollectTarget target, String dealYmd, Map<String, Integer> stats) {
        final int numOfRows = 1000;
        int pageNo = 1;
        int totalFetched = 0;
        int totalCount = 0;

        do {
            final int currentPage = pageNo;
            JsonNode response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .scheme("https").host("apis.data.go.kr").path(TRADE_API_PATH)
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

            JsonNode body = response == null ? null : response.path("response").path("body");
            totalCount = body == null ? 0 : body.path("totalCount").asInt(0);

            JsonNode itemNode = extractItemNode(response);
            if (itemNode == null || itemNode.isMissingNode() || itemNode.isNull()) break;

            int pageItemCount = 0;
            if (itemNode.isArray()) {
                for (JsonNode node : itemNode) {
                    saveSingleTrade(node, target.sigungu(), stats);
                    pageItemCount++;
                }
            } else {
                saveSingleTrade(itemNode, target.sigungu(), stats);
                pageItemCount = 1;
            }

            totalFetched += pageItemCount;
            pageNo++;
            if (pageItemCount < numOfRows) break;

        } while (totalFetched < totalCount);
    }

    /**
     * 거래 1건을 파싱하여 real_trade 테이블에 저장합니다.
     * 단지 마스터가 없으면 스킵합니다.
     */
    private void saveSingleTrade(JsonNode item, String sigungu, Map<String, Integer> stats) {
        String aptNm = text(item, "aptNm");
        if (aptNm == null || aptNm.isBlank()) return;

        // API 간 단지명 형식 차이를 고려한 다단계 매칭
        String umdNm = text(item, "umdNm");
        Optional<Apartment> found = resolveApartment(aptNm, umdNm, sigungu);
        if (found.isEmpty()) {
            log.warn("단지 마스터 없음 — 거래 스킵. sigungu={}, umdNm={}, aptNm={}", sigungu, umdNm, aptNm);
            stats.computeIfPresent("skippedNoApartment", (k, v) -> v + 1);
            return;
        }

        Integer tradeYear  = intValue(item, "dealYear");
        Integer tradeMonth = intValue(item, "dealMonth");
        Integer tradeDay   = intValue(item, "dealDay");
        if (tradeYear == null || tradeMonth == null || tradeDay == null) return;

        LocalDate tradeDate;
        try {
            tradeDate = LocalDate.of(tradeYear, tradeMonth, tradeDay);
        } catch (RuntimeException e) {
            log.warn("날짜 파싱 실패. year={}, month={}, day={}, aptNm={}", tradeYear, tradeMonth, tradeDay, aptNm);
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

    /**
     * 단지명 기반 다단계 매칭.
     * 두 API의 단지명 형식 차이("헬리오시티" vs "헬리오시티아파트")를 흡수합니다.
     * umdNm(법정동) 기준으로 먼저 좁히고, 없으면 sigungu(시군구) 기준으로 폴백합니다.
     */
    private Optional<Apartment> resolveApartment(String aptNm, String umdNm, String sigungu) {
        if (umdNm != null) {
            Optional<Apartment> found = apartmentRepository.findFirstByComplexNameAndEupMyeonDong(aptNm, umdNm);
            if (found.isPresent()) return found;

            found = apartmentRepository.findFirstByComplexNameAndEupMyeonDong(aptNm + "아파트", umdNm);
            if (found.isPresent()) return found;
        }

        Optional<Apartment> found = apartmentRepository.findFirstByComplexNameAndSigungu(aptNm, sigungu);
        if (found.isPresent()) return found;

        return apartmentRepository.findFirstByComplexNameAndSigungu(aptNm + "아파트", sigungu);
    }

    // -----------------------------------------------------------------------
    // 유틸리티
    // -----------------------------------------------------------------------

    private JsonNode extractItemNode(JsonNode response) {
        if (response == null) return null;
        return response.path("response").path("body").path("items").path("item");
    }

    private Map<String, Integer> initStats() {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("savedTrades", 0);
        stats.put("skippedNoApartment", 0);
        stats.put("duplicateTrades", 0);
        return stats;
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
}
