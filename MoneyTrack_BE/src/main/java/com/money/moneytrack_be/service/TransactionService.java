package com.money.moneytrack_be.service;

import com.money.moneytrack_be.entity.Category;
import com.money.moneytrack_be.entity.Transaction;
import com.money.moneytrack_be.entity.User;
import com.money.moneytrack_be.enums.DeleteFlag;
import com.money.moneytrack_be.enums.TransactionType;
import com.money.moneytrack_be.exception.BadRequestException;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.CategoryRepository;
import com.money.moneytrack_be.repository.TransactionRepository;
import com.money.moneytrack_be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public Transaction create(String userEmail, BigDecimal amount, TransactionType type,
                              Long categoryId, String description, LocalDate date) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        if (category.getDeleteFlag() == DeleteFlag.DELETED) {
            throw new ResourceNotFoundException("Category not found with id: " + categoryId);
        }

        if (!category.getType().name().equals(type.name())) {
            throw new BadRequestException(
                    "Category type " + category.getType() + " does not match transaction type " + type);
        }

        Transaction transaction = Transaction.builder()
                .amount(amount)
                .type(type)
                .category(category)
                .description(description)
                .date(date)
                .user(user)
                .deleteFlag(DeleteFlag.ACTIVE)
                .build();

        return transactionRepository.save(transaction);
    }

    public Page<Transaction> getTransactions(String userEmail, String month,
                                             Long categoryId, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        YearMonth yearMonth = resolveMonth(month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        return transactionRepository.findByUserAndDeleteFlagAndDateRangeAndOptionalCategory(
                user, DeleteFlag.ACTIVE, startDate, endDate, categoryId, pageable);
    }

    public Transaction update(String userEmail, Long transactionId, BigDecimal amount,
                              TransactionType type, Long categoryId, String description, LocalDate date) {
        Transaction transaction = getOwnedTransaction(userEmail, transactionId);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        if (category.getDeleteFlag() == DeleteFlag.DELETED) {
            throw new ResourceNotFoundException("Category not found with id: " + categoryId);
        }

        if (!category.getType().name().equals(type.name())) {
            throw new BadRequestException(
                    "Category type " + category.getType() + " does not match transaction type " + type);
        }

        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setCategory(category);
        transaction.setDescription(description);
        transaction.setDate(date);

        return transactionRepository.save(transaction);
    }

    public void delete(String userEmail, Long transactionId) {
        Transaction transaction = getOwnedTransaction(userEmail, transactionId);
        transaction.setDeleteFlag(DeleteFlag.DELETED);
        transactionRepository.save(transaction);
    }

    private Transaction getOwnedTransaction(String userEmail, Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + transactionId));

        if (!transaction.getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You do not have permission to modify this transaction");
        }

        return transaction;
    }

    private YearMonth resolveMonth(String month) {
        YearMonth now = YearMonth.now();
        if ("previous".equalsIgnoreCase(month)) {
            return now.minusMonths(1);
        }
        
        if (month != null && month.matches("0?[1-9]|1[0-2]")) {
            return YearMonth.of(now.getYear(), Integer.parseInt(month));
        }
        
        return now; // default: current
    }
}
