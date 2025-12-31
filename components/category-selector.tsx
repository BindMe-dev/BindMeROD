"use client"

import { CATEGORIES, getCategoryInfo } from "@/lib/categories"
import type { AgreementCategory } from "@/lib/agreement-types"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CategorySelectorProps {
  value?: AgreementCategory
  onChange: (value: AgreementCategory) => void
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select value={value || "uncategorized"} onValueChange={(val) => onChange(val as AgreementCategory)}>
        <SelectTrigger id="category">
          <SelectValue>
            {value ? (
              <span className="flex items-center gap-2">
                <span>{getCategoryInfo(value).icon}</span>
                <span>{getCategoryInfo(value).name}</span>
              </span>
            ) : (
              "Select category"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <span className="flex items-center gap-2">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
