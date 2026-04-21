package com.money.moneytrack_be.entity;

import com.money.moneytrack_be.enums.CategoryType;
import com.money.moneytrack_be.enums.DeleteFlag;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "delete_flag", nullable = false)
    @Builder.Default
    private DeleteFlag deleteFlag = DeleteFlag.ACTIVE;
}
