package com.money.moneytrack_be.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ExpenseByCategoryResponse {
    private String categoryName;
    private BigDecimal totalAmount;
    private BigDecimal percentage;
}
