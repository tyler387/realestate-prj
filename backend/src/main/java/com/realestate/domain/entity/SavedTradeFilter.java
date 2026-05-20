package com.realestate.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "saved_trade_filter")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SavedTradeFilter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "filter_name", nullable = false, length = 100)
    private String filterName;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private SavedTradeFilter(User user, String filterName, String payload) {
        this.user = user;
        this.filterName = filterName;
        this.payload = payload;
    }

    public static SavedTradeFilter create(User user, String filterName, String payload) {
        return new SavedTradeFilter(user, filterName, payload);
    }

    public void update(String filterName, String payload) {
        this.filterName = filterName;
        this.payload = payload;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
