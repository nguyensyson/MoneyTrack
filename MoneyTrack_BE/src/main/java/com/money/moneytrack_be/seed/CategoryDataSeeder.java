package com.money.moneytrack_be.seed;

import com.money.moneytrack_be.entity.CategoryItem;
import com.money.moneytrack_be.enums.CategoryType;
import com.money.moneytrack_be.repository.CategoryDynamoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Seeds default categories into DynamoDB on first startup.
 * Runs after DynamoDbTableInitializer (Order 1) at Order 2.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class CategoryDataSeeder implements ApplicationRunner {

    private final CategoryDynamoRepository categoryRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (categoryRepository.count() > 0) {
            log.info("Categories already seeded, skipping.");
            return;
        }
        log.info("Seeding default categories...");
        seedIncome();
        seedExpense();
        seedDebt();
        log.info("Category seeding complete.");
    }

    private void seedIncome() {
        saveParent("Lương",             CategoryType.INCOME);
        saveParent("Thu nhập khác",     CategoryType.INCOME);
        saveParent("Tiền chuyển đến",   CategoryType.INCOME);
        saveParent("Thu lãi",           CategoryType.INCOME);
        saveParent("Khoản thu khác",    CategoryType.INCOME);
    }

    private void seedExpense() {
        saveParent("Ăn uống",                   CategoryType.EXPENSE);
        CategoryItem invoice = saveParent("Hoá đơn & Tiện ích", CategoryType.EXPENSE);
        CategoryItem shopping = saveParent("Mua sắm",           CategoryType.EXPENSE);
        CategoryItem family = saveParent("Gia đình",            CategoryType.EXPENSE);
        CategoryItem transfer = saveParent("Di chuyển",         CategoryType.EXPENSE);
        CategoryItem health = saveParent("Sức khoẻ",            CategoryType.EXPENSE);
        saveParent("Giáo dục",                  CategoryType.EXPENSE);
        CategoryItem entertainment = saveParent("Giải trí",     CategoryType.EXPENSE);
        saveParent("Quà tặng & Quyên góp",      CategoryType.EXPENSE);
        saveParent("Bảo hiểm",                  CategoryType.EXPENSE);
        saveParent("Đầu tư",                    CategoryType.EXPENSE);
        saveParent("Các chi phí khác",          CategoryType.EXPENSE);
        saveParent("Tiền chuyển đi",            CategoryType.EXPENSE);
        saveParent("Trả lãi",                   CategoryType.EXPENSE);

        saveChildren(invoice, List.of(
                "Thuê nhà", "Hoá đơn nước", "Hoá đơn điện thoại",
                "Hoá đơn điện", "Hoá đơn gas", "Hoá đơn TV",
                "Hoá đơn internet", "Hoá đơn tiện ích khác"
        ), CategoryType.EXPENSE);

        saveChildren(shopping, List.of(
                "Đồ dùng cá nhân", "Đồ gia dụng", "Làm đẹp"
        ), CategoryType.EXPENSE);

        saveChildren(family, List.of(
                "Sửa & trang trí nhà", "Dịch vụ gia đình", "Vật nuôi"
        ), CategoryType.EXPENSE);

        saveChildren(transfer, List.of(
                "Bảo dưỡng xe"
        ), CategoryType.EXPENSE);

        saveChildren(health, List.of(
                "Khám sức khoẻ", "Thể dục thể thao"
        ), CategoryType.EXPENSE);

        saveChildren(entertainment, List.of(
                "Dịch vụ trực tuyến", "Vui chơi"
        ), CategoryType.EXPENSE);
    }

    private void seedDebt() {
        saveParent("Cho vay",  CategoryType.DEBT);
        saveParent("Trả nợ",   CategoryType.DEBT);
        saveParent("Thu nợ",   CategoryType.DEBT);
        saveParent("Đi vay",   CategoryType.DEBT);
    }

    private CategoryItem saveParent(String name, CategoryType type) {
        String now = Instant.now().toString();
        CategoryItem item = CategoryItem.builder()
                .categoryId(UUID.randomUUID().toString())
                .name(name)
                .type(type.name())
                .parentId(null)
                .deleteFlag(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return categoryRepository.save(item);
    }

    private void saveChildren(CategoryItem parent, List<String> names, CategoryType type) {
        String now = Instant.now().toString();
        names.forEach(name -> {
            CategoryItem child = CategoryItem.builder()
                    .categoryId(UUID.randomUUID().toString())
                    .name(name)
                    .type(type.name())
                    .parentId(parent.getCategoryId())
                    .deleteFlag(0)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            categoryRepository.save(child);
        });
    }
}
