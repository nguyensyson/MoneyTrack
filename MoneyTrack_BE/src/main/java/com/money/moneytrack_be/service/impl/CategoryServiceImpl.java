package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.request.CategoryRequest;
import com.money.moneytrack_be.dto.response.CategoryResponse;
import com.money.moneytrack_be.entity.CategoryItem;
import com.money.moneytrack_be.enums.CategoryType;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.CategoryDynamoRepository;
import com.money.moneytrack_be.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryDynamoRepository categoryRepository;

    @Override
    public List<CategoryResponse> getCategories(CategoryType type) {
        List<CategoryItem> flat = (type != null)
                ? categoryRepository.findActiveByType(type.name())
                : categoryRepository.findAllActive();

        // Build tree: parents first, then attach children
        List<CategoryItem> parents = flat.stream()
                .filter(c -> c.getParentId() == null || c.getParentId().isBlank())
                .collect(Collectors.toList());

        return parents.stream()
                .map(parent -> toResponse(parent, flat))
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        String parentId = resolveParentId(request.getParentId());
        String now = Instant.now().toString();
        CategoryItem item = CategoryItem.builder()
                .categoryId(UUID.randomUUID().toString())
                .name(request.getName())
                .type(request.getType().name())
                .parentId(parentId)
                .deleteFlag(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return toSingleResponse(categoryRepository.save(item));
    }

    @Override
    public CategoryResponse updateCategory(String categoryId, CategoryRequest request) {
        CategoryItem item = getActiveCategory(categoryId);
        String parentId = resolveParentId(request.getParentId());
        item.setName(request.getName());
        item.setType(request.getType().name());
        item.setParentId(parentId);
        item.setUpdatedAt(Instant.now().toString());
        return toSingleResponse(categoryRepository.save(item));
    }

    @Override
    public void deleteCategory(String categoryId) {
        CategoryItem item = getActiveCategory(categoryId);
        item.setDeleteFlag(1);
        item.setUpdatedAt(Instant.now().toString());
        categoryRepository.save(item);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private CategoryItem getActiveCategory(String categoryId) {
        return categoryRepository.findById(categoryId)
                .filter(c -> c.getDeleteFlag() == 0)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private String resolveParentId(String parentId) {
        if (parentId == null || parentId.isBlank()) return null;
        categoryRepository.findById(parentId)
                .filter(c -> c.getDeleteFlag() == 0)
                .orElseThrow(() -> new ResourceNotFoundException("Parent category not found: " + parentId));
        return parentId;
    }

    private CategoryResponse toSingleResponse(CategoryItem item) {
        return CategoryResponse.builder()
                .id(item.getCategoryId())
                .name(item.getName())
                .type(CategoryType.valueOf(item.getType()))
                .children(List.of())
                .build();
    }

    private CategoryResponse toResponse(CategoryItem parent, List<CategoryItem> all) {
        List<CategoryResponse> children = all.stream()
                .filter(c -> parent.getCategoryId().equals(c.getParentId()))
                .map(child -> CategoryResponse.builder()
                        .id(child.getCategoryId())
                        .name(child.getName())
                        .type(CategoryType.valueOf(child.getType()))
                        .parentId(child.getParentId())
                        .children(List.of())
                        .build())
                .collect(Collectors.toList());

        return CategoryResponse.builder()
                .id(parent.getCategoryId())
                .name(parent.getName())
                .type(CategoryType.valueOf(parent.getType()))
                .children(children)
                .build();
    }
}
