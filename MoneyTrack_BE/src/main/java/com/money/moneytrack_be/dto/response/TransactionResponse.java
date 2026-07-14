package com.money.moneytrack_be.dto.response;

import com.money.moneytrack_be.entity.TransactionItem;
import com.money.moneytrack_be.enums.TransactionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class TransactionResponse {

    private String id;
    private BigDecimal amount;
    private TransactionType type;
    private String categoryId;
    private String categoryName;
    private String parentCategoryId;
    private String parentCategoryName;
    private String description;
    private LocalDate date;

    public static TransactionResponse from(TransactionItem t) {
        return TransactionResponse.builder()
                .id(t.getTransactionId())
                .amount(new BigDecimal(t.getAmount()))
                .type(TransactionType.valueOf(t.getType()))
                .categoryId(t.getCategoryId())
                .categoryName(t.getCategoryName())
                .parentCategoryId(t.getParentCategoryId())
                .parentCategoryName(t.getParentCategoryName())
                .description(t.getDescription())
                .date(LocalDate.parse(t.getDate()))
                .build();
    }
}
