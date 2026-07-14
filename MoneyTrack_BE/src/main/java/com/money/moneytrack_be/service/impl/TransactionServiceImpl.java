package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.entity.CategoryItem;
import com.money.moneytrack_be.entity.TransactionItem;
import com.money.moneytrack_be.entity.UserItem;
import com.money.moneytrack_be.enums.TransactionType;
import com.money.moneytrack_be.exception.BadRequestException;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.CategoryDynamoRepository;
import com.money.moneytrack_be.repository.TransactionDynamoRepository;
import com.money.moneytrack_be.repository.UserDynamoRepository;
import com.money.moneytrack_be.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionDynamoRepository transactionRepository;
    private final CategoryDynamoRepository categoryRepository;
    private final UserDynamoRepository userRepository;

    @Override
    public TransactionItem create(String userEmail, BigDecimal amount, TransactionType type,
                                  String categoryId, String description, LocalDate date) {
        validateAmount(amount);

        UserItem user = getUserByEmail(userEmail);
        CategoryItem category = getActiveCategory(categoryId);
        validateCategoryType(category, type);

        String now = Instant.now().toString();
        TransactionItem item = TransactionItem.builder()
                .transactionId(UUID.randomUUID().toString())
                .userId(user.getUserId())
                .date(date.toString())
                .amount(amount.toPlainString())
                .type(type.name())
                .categoryId(category.getCategoryId())
                .categoryName(category.getName())
                .categoryType(category.getType())
                .parentCategoryId(category.getParentId())
                .parentCategoryName(resolveParentName(category))
                .description(description)
                .deleteFlag(0)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return transactionRepository.save(item);
    }

    @Override
    public Page<TransactionItem> getTransactions(String userEmail, Integer month, Integer year,
                                                  String categoryId, Pageable pageable) {
        UserItem user = getUserByEmail(userEmail);
        YearMonth yearMonth = resolveYearMonth(month, year);
        String startDate = yearMonth.atDay(1).toString();
        String endDate = yearMonth.atEndOfMonth().toString();

        List<TransactionItem> all = transactionRepository
                .findByUserIdAndDateRange(user.getUserId(), startDate, endDate)
                .stream()
                .filter(t -> t.getDeleteFlag() == 0)
                .filter(t -> categoryId == null || categoryId.equals(t.getCategoryId()))
                .sorted(Comparator.comparing(TransactionItem::getDate).reversed())
                .collect(Collectors.toList());

        return toPage(all, pageable);
    }

    @Override
    public TransactionItem update(String userEmail, String transactionId, BigDecimal amount,
                                   TransactionType type, String categoryId, String description, LocalDate date) {
        TransactionItem item = getOwnedTransaction(userEmail, transactionId);
        validateAmount(amount);

        CategoryItem category = getActiveCategory(categoryId);
        validateCategoryType(category, type);

        item.setAmount(amount.toPlainString());
        item.setType(type.name());
        item.setCategoryId(category.getCategoryId());
        item.setCategoryName(category.getName());
        item.setCategoryType(category.getType());
        item.setParentCategoryId(category.getParentId());
        item.setParentCategoryName(resolveParentName(category));
        item.setDescription(description);
        item.setDate(date.toString());
        item.setUpdatedAt(Instant.now().toString());

        return transactionRepository.save(item);
    }

    @Override
    public void delete(String userEmail, String transactionId) {
        TransactionItem item = getOwnedTransaction(userEmail, transactionId);
        item.setDeleteFlag(1);
        item.setUpdatedAt(Instant.now().toString());
        transactionRepository.save(item);
    }

    @Override
    public List<TransactionItem> getTransactionsForExport(String userEmail, String month, String categoryId) {
        YearMonth yearMonth;
        try {
            yearMonth = YearMonth.parse(month, DateTimeFormatter.ofPattern("yyyy-MM"));
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Invalid month format. Expected yyyy-MM");
        }

        UserItem user = getUserByEmail(userEmail);
        String startDate = yearMonth.atDay(1).toString();
        String endDate = yearMonth.atEndOfMonth().toString();

        return transactionRepository
                .findByUserIdAndDateRange(user.getUserId(), startDate, endDate)
                .stream()
                .filter(t -> t.getDeleteFlag() == 0)
                .filter(t -> categoryId == null || categoryId.equals(t.getCategoryId()))
                .sorted(Comparator.comparing(TransactionItem::getDate))
                .collect(Collectors.toList());
    }

    @Override
    public byte[] buildCsvBytesPublic(List<TransactionItem> transactions) {
        StringBuilder sb = new StringBuilder();
        sb.append('\uFEFF'); // UTF-8 BOM
        sb.append("Date,Title,Category,Type,Amount,Note\n");

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (TransactionItem t : transactions) {
            String description = t.getDescription() != null ? t.getDescription() : "";
            String title = description.isEmpty() ? t.getCategoryName() : description;

            sb.append(escapeCsvField(t.getDate())).append(",")
              .append(escapeCsvField(title)).append(",")
              .append(escapeCsvField(t.getCategoryName())).append(",")
              .append(escapeCsvField(t.getType())).append(",")
              .append(escapeCsvField(t.getAmount())).append(",")
              .append(escapeCsvField(description)).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public String buildExportFilename(String month, String categoryId, List<TransactionItem> transactions) {
        if (categoryId == null || transactions.isEmpty()) {
            return "transactions_" + month + ".csv";
        }
        String categoryName = transactions.get(0).getCategoryName();
        return "transactions_" + month + "_" + categoryName + ".csv";
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private UserItem getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private CategoryItem getActiveCategory(String categoryId) {
        return categoryRepository.findById(categoryId)
                .filter(c -> c.getDeleteFlag() == 0)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }
    }

    private void validateCategoryType(CategoryItem category, TransactionType type) {
        if (!category.getType().equals(type.name())) {
            throw new BadRequestException(
                    "Category type " + category.getType() + " does not match transaction type " + type);
        }
    }

    private String resolveParentName(CategoryItem category) {
        if (category.getParentId() == null || category.getParentId().isBlank()) return null;
        return categoryRepository.findById(category.getParentId())
                .map(CategoryItem::getName)
                .orElse(null);
    }

    private TransactionItem getOwnedTransaction(String userEmail, String transactionId) {
        TransactionItem item = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        UserItem user = getUserByEmail(userEmail);
        if (!user.getUserId().equals(item.getUserId())) {
            throw new AccessDeniedException("You do not have permission to modify this transaction");
        }
        return item;
    }

    private YearMonth resolveYearMonth(Integer month, Integer year) {
        YearMonth now = YearMonth.now();
        int resolvedYear  = (year  != null) ? year  : now.getYear();
        int resolvedMonth = (month != null) ? month : now.getMonthValue();
        return YearMonth.of(resolvedYear, resolvedMonth);
    }

    private <T> Page<T> toPage(List<T> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), list.size());
        List<T> subList = (start >= list.size()) ? List.of() : list.subList(start, end);
        return new PageImpl<>(subList, pageable, list.size());
    }

    private String escapeCsvField(String value) {
        if (value == null) return "";
        // Wrap in quotes and escape any existing quotes by doubling them
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
