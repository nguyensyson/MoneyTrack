package com.money.moneytrack_be.repository;

import com.money.moneytrack_be.entity.Category;
import com.money.moneytrack_be.enums.CategoryType;
import com.money.moneytrack_be.enums.DeleteFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByDeleteFlag(DeleteFlag deleteFlag);

    List<Category> findByTypeAndDeleteFlag(CategoryType type, DeleteFlag deleteFlag);
}
