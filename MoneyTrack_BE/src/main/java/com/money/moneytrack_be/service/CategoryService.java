package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.request.CategoryRequest;
import com.money.moneytrack_be.dto.response.CategoryResponse;
import com.money.moneytrack_be.enums.CategoryType;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getCategories(CategoryType type);

    CategoryResponse createCategory(CategoryRequest request);

    CategoryResponse updateCategory(Long id, CategoryRequest request);

    void deleteCategory(Long id);
}
