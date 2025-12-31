import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Sparkles, Clock, FileText, ChevronRight, UserX, User, Users, Star } from "lucide-react"
import { AGREEMENT_TEMPLATES, TEMPLATE_CATEGORIES, type AgreementTemplate, type TemplateCategory } from "@/lib/templates"

interface TemplateBrowserProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: AgreementTemplate) => void
}

const getCounterpartyIcon = (counterpartyType: string) => {
  switch (counterpartyType) {
    case "none": return <UserX className="w-3 h-3" />
    case "single": return <User className="w-3 h-3" />
    case "multiple": return <Users className="w-3 h-3" />
    default: return null
  }
}

const getCounterpartyLabel = (counterpartyType: string) => {
  switch (counterpartyType) {
    case "none": return "No counterparties"
    case "single": return "1 Counterparty"
    case "multiple": return "Multiple"
    default: return ""
  }
}

export function TemplateBrowser({ open, onOpenChange, onSelectTemplate }: TemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all")

  const filteredTemplates = AGREEMENT_TEMPLATES.filter((template) => {
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] h-[95vh] p-0 gap-0 bg-slate-950 border-slate-800">
        <DialogHeader className="px-6 py-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-2xl font-bold text-white">
                Agreement Templates
              </DialogTitle>
              <p className="text-slate-400 mt-1">
                Choose from professionally crafted templates designed for common agreement types
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full min-h-0">
          {/* Search */}
          <div className="px-6 py-4 shrink-0 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-16">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">No templates found</h3>
                    <p className="text-slate-400">Try adjusting your search terms</p>
                  </div>
                ) : (
                  <div className="grid gap-12 grid-cols-1 xl:grid-cols-2 max-w-7xl mx-auto">
                    {filteredTemplates.map((template) => {
                      const categoryData = TEMPLATE_CATEGORIES[template.category]
                      const typeLabel =
                        template.type === "one-time"
                          ? "One-Time"
                          : template.type === "recurring"
                            ? `Recurring (${template.recurrenceFrequency})`
                            : template.type === "deadline"
                              ? "Deadline"
                              : "Bet / Wager"
                      
                      return (
                        <div
                          key={template.id}
                          onClick={() => {
                            onSelectTemplate(template)
                            onOpenChange(false)
                          }}
                          className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 hover:bg-slate-900/70 transition-all duration-200 cursor-pointer backdrop-blur-sm min-h-[320px] flex flex-col"
                        >
                          {/* Popular Badge */}
                          {template.popular && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Popular
                            </div>
                          )}

                          {/* Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-500/30 group-hover:to-purple-600/30 transition-colors">
                              <span className="text-2xl">{template.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors mb-3 leading-tight text-lg">
                                {template.title}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 px-3 py-1">
                                  <span className="mr-2">{categoryData.icon}</span>
                                  {categoryData.label}
                                </Badge>
                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 px-3 py-1">
                                  {getCounterpartyIcon(template.counterpartyType)}
                                  <span className="ml-2">{getCounterpartyLabel(template.counterpartyType)}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-slate-300 mb-6 flex-1 leading-relaxed">
                            {template.description}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-auto">
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {typeLabel}
                              </span>
                              <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {template.fields.length} fields
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}







