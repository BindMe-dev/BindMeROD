"use client"

/**
 * Law Firm Marketplace - User-Facing Page
 * 
 * WHY THIS PAGE EXISTS:
 * When a user's agreement dispute can't be resolved through friendly negotiation,
 * they need professional legal help. This page connects them with verified law firms.
 * 
 * USER JOURNEY:
 * 1. User has disputed agreement
 * 2. Friendly resolution attempts fail
 * 3. User clicks "Get Legal Help" button on agreement page
 * 4. Lands HERE - sees verified law firms
 * 5. Filters by specialization, price, rating
 * 6. Selects firm and requests consultation
 * 7. Firm reviews case and accepts/declines
 * 8. If accepted: engagement begins
 * 
 * BUSINESS VALUE:
 * - Keeps users on platform (don't lose them to Google search)
 * - Generates commission revenue (15-20% of legal fees)
 * - Builds trust (professional backing)
 * - Creates network effects (law firms bring their clients)
 */

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RequestConsultationDialog } from "@/components/request-consultation-dialog"
import {
  Building2,
  Star,
  MapPin,
  DollarSign,
  CheckCircle,
  Search,
  Filter,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react"

interface LawFirm {
  id: string
  name: string
  description: string
  logo?: string
  practiceAreas: string[]
  location: string
  rating: number
  reviewCount: number
  successRate: number
  avgResponseTime: number // hours
  verified: boolean
  pricing: {
    tier: 'budget' | 'standard' | 'premium'
    consultationFee: number
    hourlyRate: number
  }
  services: Array<{
    name: string
    description: string
    price: number
  }>
}

export default function LegalHelpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agreementId = searchParams.get('agreementId')

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArea, setSelectedArea] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [firms, setFirms] = useState<LawFirm[]>([])

  // Consultation modal state
  const [consultationModalOpen, setConsultationModalOpen] = useState(false)
  const [selectedFirm, setSelectedFirm] = useState<LawFirm | null>(null)
  const [agreementTitle, setAgreementTitle] = useState<string | undefined>(undefined)

  // Fetch law firms
  useEffect(() => {
    const fetchFirms = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/lawfirms")
        if (res.ok) {
          const data = await res.json()
          // Transform data to match our interface
          const transformedFirms: LawFirm[] = (data.firms || [])
            .filter((f: any) => f.status === 'active' && f.verified)
            .map((firm: any) => ({
              id: firm.id,
              name: firm.name,
              description: firm.description || 'Professional legal services',
              logo: firm.logo,
              practiceAreas: firm.practiceAreas || [],
              location: `${firm.city || firm.region || 'UK'}`,
              rating: (firm.userRating || 0) / 10, // Convert from 0-50 to 0-5.0
              reviewCount: firm.reviewCount || 0,
              successRate: firm.successRate || 0,
              avgResponseTime: firm.avgResponseTimeHours || 24,
              verified: firm.verified || false,
              pricing: {
                tier: 'standard' as const,
                consultationFee: 0,
                hourlyRate: 200,
              },
              services: [
                {
                  name: 'Dispute Resolution',
                  description: 'Negotiate settlement without court',
                  price: 500,
                },
                {
                  name: 'Full Legal Support',
                  description: 'Complete legal representation',
                  price: 1500,
                },
              ],
            }))
          setFirms(transformedFirms)
        }
      } catch (error) {
        console.error("Error fetching firms:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFirms()
  }, [])

  // Fetch agreement title if agreementId is provided
  useEffect(() => {
    if (agreementId) {
      const fetchAgreement = async () => {
        try {
          const res = await fetch(`/api/agreements/${agreementId}`)
          if (res.ok) {
            const data = await res.json()
            setAgreementTitle(data.agreement?.title)
          }
        } catch (error) {
          console.error("Error fetching agreement:", error)
        }
      }
      fetchAgreement()
    }
  }, [agreementId])

  const handleRequestConsultation = (firm: LawFirm) => {
    setSelectedFirm(firm)
    setConsultationModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <button onClick={() => router.back()} className="hover:text-white">
              ← Back to Agreement
            </button>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Find Legal Help</h1>
          <p className="text-slate-400 text-lg">
            Connect with verified law firms specializing in your type of dispute
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Verified Firms Only</p>
                  <p className="text-sm text-slate-400">All firms are vetted and licensed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Transparent Pricing</p>
                  <p className="text-sm text-slate-400">No hidden fees or surprises</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">High Success Rate</p>
                  <p className="text-sm text-slate-400">Average 89% case success</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by firm name or practice area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/60 border-slate-800 text-white h-12"
            />
          </div>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-full md:w-[200px] bg-slate-900/60 border-slate-800 text-white h-12">
              <SelectValue placeholder="Practice Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="contract">Contract Law</SelectItem>
              <SelectItem value="debt">Debt Recovery</SelectItem>
              <SelectItem value="property">Property Disputes</SelectItem>
              <SelectItem value="employment">Employment Law</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-slate-900/60 border-slate-800 text-white h-12">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="budget">Budget (£)</SelectItem>
              <SelectItem value="standard">Standard (££)</SelectItem>
              <SelectItem value="premium">Premium (£££)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading verified law firms...</p>
            </CardContent>
          </Card>
        )}

        {/* Law Firm Cards */}
        {!loading && firms.length > 0 && (
          <div className="space-y-6">
            {firms
              .filter((firm) => {
                // Search filter
                if (searchQuery && !firm.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    !firm.practiceAreas.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()))) {
                  return false
                }
                // Practice area filter
                if (selectedArea !== 'all' && !firm.practiceAreas.some(area =>
                  area.toLowerCase().includes(selectedArea.toLowerCase())
                )) {
                  return false
                }
                // Price filter
                if (priceFilter !== 'all' && firm.pricing.tier !== priceFilter) {
                  return false
                }
                return true
              })
              .map((firm) => (
            <Card key={firm.id} className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Firm Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold text-white">{firm.name}</h3>
                          {firm.verified && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {firm.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {firm.rating} ({firm.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-300 mb-4">{firm.description}</p>

                    {/* Practice Areas */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">Practice Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {firm.practiceAreas.map((area) => (
                          <Badge key={area} variant="outline" className="border-slate-700 text-slate-300">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-slate-800/60 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Success Rate</p>
                        <p className="text-lg font-bold text-green-400">{firm.successRate}%</p>
                      </div>
                      <div className="bg-slate-800/60 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Response Time</p>
                        <p className="text-lg font-bold text-blue-400">{firm.avgResponseTime}h</p>
                      </div>
                      <div className="bg-slate-800/60 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Consultation</p>
                        <p className="text-lg font-bold text-purple-400">
                          {firm.pricing.consultationFee === 0 ? 'Free' : `£${firm.pricing.consultationFee}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Services & CTA */}
                  <div className="md:w-80 space-y-4">
                    <div className="bg-slate-800/60 rounded-lg p-4">
                      <p className="text-sm font-semibold text-white mb-3">Services</p>
                      <div className="space-y-3">
                        {firm.services.map((service) => (
                          <div key={service.name} className="border-b border-slate-700 last:border-0 pb-3 last:pb-0">
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-medium text-white text-sm">{service.name}</p>
                              <p className="font-bold text-purple-400">£{service.price}</p>
                            </div>
                            <p className="text-xs text-slate-400">{service.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-12"
                      onClick={() => handleRequestConsultation(firm)}
                    >
                      Request Consultation
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                      onClick={() => router.push(`/legal-help/${firm.id}`)}
                    >
                      View Full Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
              ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && firms.length === 0 && (
          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="py-12 text-center">
              <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No law firms found matching your criteria</p>
              <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Consultation Request Modal */}
      {selectedFirm && (
        <RequestConsultationDialog
          open={consultationModalOpen}
          onOpenChange={setConsultationModalOpen}
          firmId={selectedFirm.id}
          firmName={selectedFirm.name}
          agreementId={agreementId || undefined}
          agreementTitle={agreementTitle}
        />
      )}
    </div>
  )
}

