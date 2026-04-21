package com.money.moneytrack_be.dto.response;

import com.money.moneytrack_be.entity.Transaction;
import com.money.moneytrack_be.enums.TransactionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class TransactionResponse {

    private Long id;
    private BigDecimal amount;
    private TransactionType type;
    private Long categoryId;
    private String categoryName;
    private String description;
    private LocalDate date;

    public static TransactionResponse from(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .amount(t.getAmount())
                .type(t.getType())
                .categoryId(t.getCategory().getId())
                .categoryName(t.getCategory().getName())
                .description(t.getDescription())
                .date(t.getDate())
                .build();
    }
}
