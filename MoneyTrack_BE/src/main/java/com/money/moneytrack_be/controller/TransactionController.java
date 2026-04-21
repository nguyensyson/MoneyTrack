package com.money.moneytrack_be.controller;

import com.money.moneytrack_be.dto.request.TransactionRequest;
import com.money.moneytrack_be.dto.response.TransactionResponse;
import com.money.moneytrack_be.entity.Transaction;
import com.money.moneytrack_be.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TransactionRequest request) {
        Transaction transaction = transactionService.create(
                userDetails.getUsername(),
                request.getAmount(),
                request.getType(),
                request.getCategoryId(),
                request.getDescription(),
                request.getDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionResponse.from(transaction));
    }

    @GetMapping
    public ResponseEntity<Page<TransactionResponse>> getTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "current") String month,
            @RequestParam(required = false) Long categoryId,
            @PageableDefault(size = 20, sort = "date") Pageable pageable) {
        Page<TransactionResponse> page = transactionService
                .getTransactions(userDetails.getUsername(), month, categoryId, pageable)
                .map(TransactionResponse::from);
        return ResponseEntity.ok(page);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {
        Transaction transaction = transactionService.update(
                userDetails.getUsername(),
                id,
                request.getAmount(),
                request.getType(),
                request.getCategoryId(),
                request.getDescription(),
                request.getDate());
        return ResponseEntity.ok(TransactionResponse.from(transaction));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        transactionService.delete(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
