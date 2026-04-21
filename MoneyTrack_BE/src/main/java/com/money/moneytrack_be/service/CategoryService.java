package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.request.CategoryRequest;
import com.money.moneytrack_be.dto.response.CategoryResponse;
import com.money.moneytrack_be.entity.Category;
import com.money.moneytrack_be.enums.CategoryType;
import com.money.moneytrack_be.enums.DeleteFlag;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getCategories(CategoryType type) {
        List<Category> flat = (type != null)
                ? categoryRepository.findByTypeAndDeleteFlag(type, DeleteFlag.ACTIVE)
                : categoryRepository.findByDeleteFlag(DeleteFlag.ACTIVE);

        // Separate parents (no parent reference) from children
        List<Category> parents = flat.stream()
                .filter(c -> c.getParent() == null)
                .collect(Collectors.toList());

        return parents.stream()
                .map(parent -> toResponse(parent, flat))
                .collect(Collectors.toList());
    }

    public CategoryResponse createCategory(CategoryRequest request) {
        Category parent = resolveParent(request.getParentId());
        Category category = Category.builder()
                .name(request.getName())
                .type(request.getType())
                .parent(parent)
                .deleteFlag(DeleteFlag.ACTIVE)
                .build();
        Category saved = categoryRepository.save(category);
        return toSingleResponse(saved);
    }

    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .filter(c -> c.getDeleteFlag() == DeleteFlag.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setName(request.getName());
        category.setType(request.getType());
        category.setParent(resolveParent(request.getParentId()));
        return toSingleResponse(categoryRepository.save(category));
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .filter(c -> c.getDeleteFlag() == DeleteFlag.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setDeleteFlag(DeleteFlag.DELETED);
        categoryRepository.save(category);
    }

    private Category resolveParent(Long parentId) {
        if (parentId == null) return null;
        return categoryRepository.findById(parentId)
                .filter(c -> c.getDeleteFlag() == DeleteFlag.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Parent category not found with id: " + parentId));
    }

    private CategoryResponse toSingleResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .children(List.of())
                .build();
    }

    private CategoryResponse toResponse(Category parent, List<Category> all) {
        List<CategoryResponse> children = all.stream()
                .filter(c -> c.getParent() != null && c.getParent().getId().equals(parent.getId()))
                .map(child -> CategoryResponse.builder()
                        .id(child.getId())
                        .name(child.getName())
                        .type(child.getType())
                        .parentId(child.getParent().getId())
                        .children(List.of())
                        .build())
                .collect(Collectors.toList());

        return CategoryResponse.builder()
                .id(parent.getId())
                .name(parent.getName())
                .type(parent.getType())
                .children(children)
                .build();
    }
}
