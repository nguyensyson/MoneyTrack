package com.money.moneytrack_be.dto.request;

import com.money.moneytrack_be.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequest {

    @NotBlank
    private String name;

    @NotNull
    private CategoryType type;

    private Long parentId;
}
