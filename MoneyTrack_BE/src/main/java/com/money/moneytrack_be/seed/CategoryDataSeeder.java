package com.money.moneytrack_be.seed;

import com.money.moneytrack_be.entity.Category;
import com.money.moneytrack_be.enums.CategoryType;
import com.money.moneytrack_be.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CategoryDataSeeder implements ApplicationRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (categoryRepository.count() > 0) {
            return;
        }

        seedIncome();
        seedExpense();
        seedDebt();
    }

    private void seedIncome() {
        Category salary     = saveParent("Lương",        CategoryType.INCOME);
        Category freelance  = saveParent("Thu nhập khác",     CategoryType.INCOME);
        Category moneyTransferred = saveParent("Tiền chuyển đến",    CategoryType.INCOME);
        Category earnProfit = saveParent("Thu lãi",    CategoryType.INCOME);
        Category other      = saveParent("Khoản thu khác",  CategoryType.INCOME);
    }

    private void seedExpense() {
        Category food          = saveParent("Ăn uống",    CategoryType.EXPENSE);
        Category invoice     = saveParent("Hoá đơn & Tiện ích",       CategoryType.EXPENSE);
        Category shopping       = saveParent("Mua sắm",         CategoryType.EXPENSE);
        Category family    = saveParent("Gia đình",      CategoryType.EXPENSE);
        Category transfer = saveParent("Di chuyển",   CategoryType.EXPENSE);
        Category health      = saveParent("Sức khoẻ",        CategoryType.EXPENSE);
        Category education     = saveParent("Giáo dục",       CategoryType.EXPENSE);
        Category entertainment     = saveParent("Giãi trí",       CategoryType.EXPENSE);
        Category present     = saveParent("Quà tặng & Quyên góp",       CategoryType.EXPENSE);
        Category insurance     = saveParent("Bảo hểm",       CategoryType.EXPENSE);
        Category invest     = saveParent("Đầu tư",       CategoryType.EXPENSE);
        Category other         = saveParent("Các chi phí khác",   CategoryType.EXPENSE);
        Category moneyTransferred         = saveParent("Tiền chuyển đi",   CategoryType.EXPENSE);
        Category payInterest         = saveParent("Trả lãi",   CategoryType.EXPENSE);

        saveChildren(invoice,     List.of("Thuê nhà", "Hoá đơn nước", "Hoá đơn điện thoại", "Hoá đơn điện", "Hoá đơn gas", "Hoá đơn TV", "Hoá đn internet", "Hoá đơn tiện ích khác"),             CategoryType.EXPENSE);
        saveChildren(shopping,       List.of("Đồ dùng cá nhân", "Đồ gia dụng", "Làm đẹp"),           CategoryType.EXPENSE);
        saveChildren(family,    List.of("Sửa & trang trí nhà", "Dịch vụ gia đình", "Vật nuôi"),            CategoryType.EXPENSE);
        saveChildren(transfer, List.of("Bảo dưỡng xe"),               CategoryType.EXPENSE);
        saveChildren(health,      List.of("Khám sức khoẻ", "Thể dụng thể thao"),      CategoryType.EXPENSE);
        saveChildren(entertainment,         List.of("Dịch vụ trực tuyến", "Vui - chơi"),                              CategoryType.EXPENSE);
    }

    private void seedDebt() {
        Category loan       = saveParent("Cho vay",  CategoryType.DEBT);
        Category payOffDebt = saveParent("Trả nợ",   CategoryType.DEBT);
        Category debtCollection      = saveParent("Thu nợ",    CategoryType.DEBT);
        Category borrow      = saveParent("Đi vay",    CategoryType.DEBT);
    }

    private Category saveParent(String name, CategoryType type) {
        return categoryRepository.save(
                Category.builder().name(name).type(type).build()
        );
    }

    private void saveChildren(Category parent, List<String> names, CategoryType type) {
        names.forEach(name ->
                categoryRepository.save(
                        Category.builder().name(name).type(type).parent(parent).build()
                )
        );
    }
}
