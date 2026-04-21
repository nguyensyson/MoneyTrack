package com.money.moneytrack_be.dto.response;

import com.money.moneytrack_be.enums.CategoryType;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private CategoryType type;
    private List<CategoryResponse> children;
    private Long parentId;
}
