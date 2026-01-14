import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  Send, Paperclip, Search, Filter, Download, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, XCircle, FileText, Calendar, User,
  TrendingUp, TrendingDown, BarChart, RefreshCw
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'

// Agent IDs from workflow.json
const RULE_EXTRACTION_AGENT_ID = "6967f2adf038ff7259fe2dc2"
const COMPLIANCE_CHECKER_AGENT_ID = "6967f2cd55d255804bb17162"
const COMPLIANCE_MANAGER_AGENT_ID = "6967f34255d255804bb1716c"

// TypeScript interfaces from actual test responses
interface ExtractedRule {
  rule_id: string
  rule_name: string
  rule_type: string
  value_threshold: string
  applicable_funds: string
  source_section: string
  confidence_score: number
  ambiguous_flag: boolean
}

interface RuleExtractionResponse {
  extracted_rules: ExtractedRule[]
  total_rules_extracted: number
  ambiguous_rules_count: number
}

interface BreachReport {
  fund_name: string
  rule_violated: string
  rule_id: string
  current_portfolio_value: string
  rule_limit: string
  variance_percentage: string
  severity_level: string
  root_cause_analysis: string
  remediation_suggestion: string
}

interface RebalancingAction {
  fund: string
  action: string
  estimated_trade_impact: string
  priority: string
  timeline: string
}

interface AmbiguityFlag {
  rule_id: string
  rule_name: string
  confidence_score: number
  ambiguity_note: string
}

interface ComplianceCheckerResponse {
  compliance_score: number
  total_rules_checked: number
  rules_passed: number
  rules_failed: number
  breach_report: BreachReport[]
  rebalancing_actions: RebalancingAction[]
  ambiguity_flags: AmbiguityFlag[]
}

interface SourceReference {
  section: string
  rule_id: string
  rule_name: string
  rule_text: string
}

interface ComplianceStatus {
  fund_name: string
  rule_checked: string
  current_value: string
  limit: string
  status: string
  headroom: string
}

interface ComplianceManagerResponse {
  response_type: string
  question?: string
  answer?: string
  source_references?: SourceReference[]
  compliance_status?: ComplianceStatus
  action_items?: any[]
  conversation_context?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  response?: NormalizedAgentResponse
}

interface Version {
  id: string
  version: string
  filename: string
  uploadDate: Date
  ruleCount: number
  uploader: string
  fileSize: string
  rules: ExtractedRule[]
}

interface Holding {
  assetClass: string
  holdingName: string
  weight: number
  sector: string
  rating: string
  country: string
}

// Mock portfolio data
const mockPortfolios = {
  'China Growth Fund': [
    { assetClass: 'Equity', holdingName: 'Tencent Holdings', weight: 8.5, sector: 'Technology', rating: 'A', country: 'China' },
    { assetClass: 'Equity', holdingName: 'Alibaba Group', weight: 7.2, sector: 'Technology', rating: 'A-', country: 'China' },
    { assetClass: 'Equity', holdingName: 'ICBC', weight: 6.8, sector: 'Financials', rating: 'A+', country: 'China' },
    { assetClass: 'Equity', holdingName: 'China Construction Bank', weight: 5.9, sector: 'Financials', rating: 'A', country: 'China' },
    { assetClass: 'Equity', holdingName: 'Ping An Insurance', weight: 5.3, sector: 'Financials', rating: 'A', country: 'China' },
    { assetClass: 'Equity', holdingName: 'Meituan', weight: 4.7, sector: 'Consumer', rating: 'BBB+', country: 'China' },
    { assetClass: 'Equity', holdingName: 'BYD Company', weight: 4.2, sector: 'Automotive', rating: 'BBB', country: 'China' },
    { assetClass: 'Equity', holdingName: 'China Mobile', weight: 3.8, sector: 'Telecom', rating: 'A-', country: 'China' },
    { assetClass: 'Equity', holdingName: 'Baidu', weight: 3.5, sector: 'Technology', rating: 'BBB+', country: 'China' },
    { assetClass: 'Equity', holdingName: 'JD.com', weight: 3.2, sector: 'Consumer', rating: 'BBB', country: 'China' },
    { assetClass: 'Cash', holdingName: 'Cash & Equivalents', weight: 12.0, sector: 'Cash', rating: 'AAA', country: 'USD' },
    { assetClass: 'Equity', holdingName: 'Other Holdings', weight: 34.9, sector: 'Various', rating: 'A-', country: 'China' }
  ],
  'Global Bond Fund': [
    { assetClass: 'Bond', holdingName: 'US Treasury 10Y', weight: 15.2, sector: 'Government', rating: 'AAA', country: 'USA' },
    { assetClass: 'Bond', holdingName: 'German Bund 10Y', weight: 12.8, sector: 'Government', rating: 'AAA', country: 'Germany' },
    { assetClass: 'Bond', holdingName: 'UK Gilt 10Y', weight: 9.5, sector: 'Government', rating: 'AA', country: 'UK' },
    { assetClass: 'Bond', holdingName: 'JP Morgan Corporate', weight: 8.3, sector: 'Corporate', rating: 'A', country: 'USA' },
    { assetClass: 'Bond', holdingName: 'Apple Inc Bond', weight: 7.1, sector: 'Corporate', rating: 'AA+', country: 'USA' },
    { assetClass: 'Bond', holdingName: 'Microsoft Bond', weight: 6.4, sector: 'Corporate', rating: 'AAA', country: 'USA' },
    { assetClass: 'Bond', holdingName: 'Toyota Motor Bond', weight: 5.9, sector: 'Corporate', rating: 'A+', country: 'Japan' },
    { assetClass: 'Bond', holdingName: 'Telecom Italia Bond', weight: 4.2, sector: 'Corporate', rating: 'BB+', country: 'Italy' },
    { assetClass: 'Bond', holdingName: 'French Govt OAT', weight: 8.7, sector: 'Government', rating: 'AA', country: 'France' },
    { assetClass: 'Bond', holdingName: 'Canadian Govt Bond', weight: 7.3, sector: 'Government', rating: 'AAA', country: 'Canada' },
    { assetClass: 'Cash', holdingName: 'Cash & Equivalents', weight: 5.5, sector: 'Cash', rating: 'AAA', country: 'USD' },
    { assetClass: 'Bond', holdingName: 'Other Holdings', weight: 9.1, sector: 'Various', rating: 'A', country: 'Various' }
  ],
  'Emerging Markets Fund': [
    { assetClass: 'Equity', holdingName: 'Taiwan Semiconductor', weight: 9.2, sector: 'Technology', rating: 'A+', country: 'Taiwan' },
    { assetClass: 'Equity', holdingName: 'Samsung Electronics', weight: 8.7, sector: 'Technology', rating: 'A', country: 'S. Korea' },
    { assetClass: 'Equity', holdingName: 'Vale SA', weight: 6.5, sector: 'Materials', rating: 'BBB', country: 'Brazil' },
    { assetClass: 'Equity', holdingName: 'Reliance Industries', weight: 5.8, sector: 'Energy', rating: 'BBB+', country: 'India' },
    { assetClass: 'Equity', holdingName: 'Infosys', weight: 5.2, sector: 'Technology', rating: 'A-', country: 'India' },
    { assetClass: 'Equity', holdingName: 'Petrobras', weight: 4.9, sector: 'Energy', rating: 'BB', country: 'Brazil' },
    { assetClass: 'Equity', holdingName: 'Naspers', weight: 4.3, sector: 'Media', rating: 'BBB', country: 'S. Africa' },
    { assetClass: 'Equity', holdingName: 'América Móvil', weight: 3.8, sector: 'Telecom', rating: 'BBB+', country: 'Mexico' },
    { assetClass: 'Bond', holdingName: 'Brazil Govt Bond', weight: 7.2, sector: 'Government', rating: 'BB-', country: 'Brazil' },
    { assetClass: 'Bond', holdingName: 'India Govt Bond', weight: 6.8, sector: 'Government', rating: 'BBB-', country: 'India' },
    { assetClass: 'Cash', holdingName: 'Cash & Equivalents', weight: 8.1, sector: 'Cash', rating: 'AAA', country: 'USD' },
    { assetClass: 'Equity', holdingName: 'Other Holdings', weight: 29.5, sector: 'Various', rating: 'BBB', country: 'Various' }
  ]
}

// Mock version history
const mockVersions: Version[] = [
  {
    id: 'v4',
    version: 'v2024.4',
    filename: 'IMA_Guidelines_Dec2024.pdf',
    uploadDate: new Date('2024-12-15'),
    ruleCount: 5,
    uploader: 'Sarah Chen',
    fileSize: '2.3 MB',
    rules: [
      { rule_id: 'R001', rule_name: 'Cash Holdings Limit', rule_type: 'Limit', value_threshold: 'Max 10% NAV', applicable_funds: 'All Funds', source_section: '§4.2', confidence_score: 95, ambiguous_flag: false },
      { rule_id: 'R002', rule_name: 'Single Issuer Exposure', rule_type: 'Limit', value_threshold: 'Max 5% NAV', applicable_funds: 'Equity Funds', source_section: '§5.1', confidence_score: 92, ambiguous_flag: false },
      { rule_id: 'R003', rule_name: 'Derivative Prohibition', rule_type: 'Restriction', value_threshold: 'No naked shorts', applicable_funds: 'All Funds', source_section: '§6.3', confidence_score: 88, ambiguous_flag: false },
      { rule_id: 'R004', rule_name: 'Credit Rating Floor', rule_type: 'Requirement', value_threshold: 'Min BBB-', applicable_funds: 'Bond Funds', source_section: '§7.1', confidence_score: 78, ambiguous_flag: true },
      { rule_id: 'R005', rule_name: 'Sector Concentration Limit', rule_type: 'Limit', value_threshold: 'Max 25% per sector', applicable_funds: 'Equity Funds', source_section: '§5.4', confidence_score: 90, ambiguous_flag: false }
    ]
  },
  {
    id: 'v3',
    version: 'v2024.3',
    filename: 'IMA_Guidelines_Sep2024.pdf',
    uploadDate: new Date('2024-09-10'),
    ruleCount: 4,
    uploader: 'Michael Park',
    fileSize: '2.1 MB',
    rules: [
      { rule_id: 'R001', rule_name: 'Cash Holdings Limit', rule_type: 'Limit', value_threshold: 'Max 10% NAV', applicable_funds: 'All Funds', source_section: '§4.2', confidence_score: 95, ambiguous_flag: false },
      { rule_id: 'R002', rule_name: 'Single Issuer Exposure', rule_type: 'Limit', value_threshold: 'Max 5% NAV', applicable_funds: 'Equity Funds', source_section: '§5.1', confidence_score: 92, ambiguous_flag: false },
      { rule_id: 'R003', rule_name: 'Derivative Prohibition', rule_type: 'Restriction', value_threshold: 'No naked shorts', applicable_funds: 'All Funds', source_section: '§6.3', confidence_score: 88, ambiguous_flag: false },
      { rule_id: 'R005', rule_name: 'Sector Concentration Limit', rule_type: 'Limit', value_threshold: 'Max 20% per sector', applicable_funds: 'Equity Funds', source_section: '§5.4', confidence_score: 90, ambiguous_flag: false }
    ]
  },
  {
    id: 'v2',
    version: 'v2024.2',
    filename: 'IMA_Guidelines_Jun2024.pdf',
    uploadDate: new Date('2024-06-05'),
    ruleCount: 3,
    uploader: 'Sarah Chen',
    fileSize: '1.9 MB',
    rules: [
      { rule_id: 'R001', rule_name: 'Cash Holdings Limit', rule_type: 'Limit', value_threshold: 'Max 15% NAV', applicable_funds: 'All Funds', source_section: '§4.2', confidence_score: 95, ambiguous_flag: false },
      { rule_id: 'R002', rule_name: 'Single Issuer Exposure', rule_type: 'Limit', value_threshold: 'Max 5% NAV', applicable_funds: 'Equity Funds', source_section: '§5.1', confidence_score: 92, ambiguous_flag: false },
      { rule_id: 'R003', rule_name: 'Derivative Prohibition', rule_type: 'Restriction', value_threshold: 'No naked shorts', applicable_funds: 'All Funds', source_section: '§6.3', confidence_score: 88, ambiguous_flag: false }
    ]
  },
  {
    id: 'v1',
    version: 'v2024.1',
    filename: 'IMA_Guidelines_Mar2024.pdf',
    uploadDate: new Date('2024-03-01'),
    ruleCount: 3,
    uploader: 'James Liu',
    fileSize: '1.8 MB',
    rules: [
      { rule_id: 'R001', rule_name: 'Cash Holdings Limit', rule_type: 'Limit', value_threshold: 'Max 15% NAV', applicable_funds: 'All Funds', source_section: '§4.2', confidence_score: 95, ambiguous_flag: false },
      { rule_id: 'R002', rule_name: 'Single Issuer Exposure', rule_type: 'Limit', value_threshold: 'Max 7% NAV', applicable_funds: 'Equity Funds', source_section: '§5.1', confidence_score: 92, ambiguous_flag: false },
      { rule_id: 'R003', rule_name: 'Derivative Prohibition', rule_type: 'Restriction', value_threshold: 'No leverage', applicable_funds: 'All Funds', source_section: '§6.3', confidence_score: 88, ambiguous_flag: false }
    ]
  }
]

// Component: Circular Compliance Score Gauge
function ComplianceGauge({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 80) return '#16a34a'
    if (score >= 60) return '#f59e0b'
    return '#dc2626'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={getColor(score)}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: getColor(score) }}>
              {score}%
            </div>
            <div className="text-xs text-gray-500">Compliance</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component: Severity Badge
function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    Critical: 'bg-red-900 text-red-100',
    High: 'bg-red-600 text-white',
    Medium: 'bg-amber-500 text-white',
    Low: 'bg-green-600 text-white'
  }

  return (
    <Badge className={colors[severity as keyof typeof colors] || 'bg-gray-500 text-white'}>
      {severity}
    </Badge>
  )
}

// Component: Chat Interface
function ChatInterface({
  messages,
  onSendMessage,
  loading
}: {
  messages: ChatMessage[]
  onSendMessage: (message: string, file?: File) => void
  loading: boolean
}) {
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSubmit = () => {
    if (input.trim() || file) {
      onSendMessage(input, file || undefined)
      setInput('')
      setFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const quickActions = [
    'Extract rules from PDF',
    'Check portfolio compliance',
    'What are current cash limits?'
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white'} rounded-lg p-4 shadow`}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="space-y-4">
                    {msg.response?.result && (
                      <>
                        {/* Compliance Manager Response (Q&A) */}
                        {msg.response.result.response_type === 'qa' && (
                          <div>
                            <p className="text-gray-800 mb-4">{msg.response.result.answer}</p>

                            {msg.response.result.compliance_status && (
                              <Card className="bg-gray-50">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm">Compliance Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">Fund:</span> {msg.response.result.compliance_status.fund_name}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Rule:</span> {msg.response.result.compliance_status.rule_checked}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Current:</span> {msg.response.result.compliance_status.current_value}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Limit:</span> {msg.response.result.compliance_status.limit}
                                    </div>
                                    <div className="col-span-2">
                                      <Badge className={msg.response.result.compliance_status.status === 'Compliant' ? 'bg-green-600' : 'bg-red-600'}>
                                        {msg.response.result.compliance_status.status}
                                      </Badge>
                                      <span className="ml-2 text-gray-600">Headroom: {msg.response.result.compliance_status.headroom}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {msg.response.result.source_references && msg.response.result.source_references.length > 0 && (
                              <div className="mt-3 text-xs text-gray-600">
                                <div className="font-semibold mb-1">Source References:</div>
                                {msg.response.result.source_references.map((ref: SourceReference, idx: number) => (
                                  <div key={idx} className="ml-2">
                                    {ref.section} - {ref.rule_name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rule Extraction Response */}
                        {msg.response.result.extracted_rules && (
                          <div>
                            <h4 className="font-semibold mb-3 text-gray-800">Extracted Rules ({msg.response.result.total_rules_extracted})</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Rule ID</TableHead>
                                  <TableHead>Rule Name</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Threshold</TableHead>
                                  <TableHead>Confidence</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {msg.response.result.extracted_rules.map((rule: ExtractedRule) => (
                                  <TableRow key={rule.rule_id}>
                                    <TableCell className="font-mono text-xs">{rule.rule_id}</TableCell>
                                    <TableCell>
                                      {rule.rule_name}
                                      {rule.ambiguous_flag && (
                                        <AlertTriangle className="inline ml-1 h-3 w-3 text-amber-500" />
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{rule.rule_type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{rule.value_threshold}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Progress value={rule.confidence_score} className="w-16" />
                                        <span className={`text-xs ${rule.confidence_score >= 90 ? 'text-green-600' : rule.confidence_score >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                                          {rule.confidence_score}%
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {msg.response.result.ambiguous_rules_count > 0 && (
                              <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {msg.response.result.ambiguous_rules_count} rule(s) flagged for review
                              </div>
                            )}
                          </div>
                        )}

                        {/* Compliance Checker Response */}
                        {msg.response.result.compliance_score !== undefined && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-800">Compliance Report</h4>
                                <p className="text-sm text-gray-600">
                                  {msg.response.result.rules_passed} of {msg.response.result.total_rules_checked} rules passed
                                </p>
                              </div>
                              <ComplianceGauge score={msg.response.result.compliance_score} />
                            </div>

                            {msg.response.result.breach_report && msg.response.result.breach_report.length > 0 && (
                              <div>
                                <h5 className="font-semibold mb-2 text-gray-800">Breaches Detected</h5>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Fund</TableHead>
                                      <TableHead>Rule Violated</TableHead>
                                      <TableHead>Current</TableHead>
                                      <TableHead>Limit</TableHead>
                                      <TableHead>Severity</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {msg.response.result.breach_report.map((breach: BreachReport, idx: number) => (
                                      <TableRow key={idx}>
                                        <TableCell className="font-medium">{breach.fund_name}</TableCell>
                                        <TableCell>{breach.rule_violated}</TableCell>
                                        <TableCell className="text-red-600">{breach.current_portfolio_value}</TableCell>
                                        <TableCell>{breach.rule_limit}</TableCell>
                                        <TableCell>
                                          <SeverityBadge severity={breach.severity_level} />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}

                            {msg.response.result.rebalancing_actions && msg.response.result.rebalancing_actions.length > 0 && (
                              <div>
                                <h5 className="font-semibold mb-2 text-gray-800">Recommended Actions</h5>
                                <div className="space-y-2">
                                  {msg.response.result.rebalancing_actions.map((action: RebalancingAction, idx: number) => (
                                    <Card key={idx} className="bg-blue-50 border-blue-200">
                                      <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">{action.fund}</div>
                                            <div className="text-sm text-gray-700">{action.action}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              Impact: {action.estimated_trade_impact} | Timeline: {action.timeline}
                                            </div>
                                          </div>
                                          <Badge className={action.priority === 'High' ? 'bg-red-600' : 'bg-amber-500'}>
                                            {action.priority}
                                          </Badge>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {msg.response.result.ambiguity_flags && msg.response.result.ambiguity_flags.length > 0 && (
                              <div>
                                <h5 className="font-semibold mb-2 text-gray-800 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  Ambiguity Review
                                </h5>
                                <div className="space-y-2">
                                  {msg.response.result.ambiguity_flags.map((flag: AmbiguityFlag, idx: number) => (
                                    <Card key={idx} className="bg-amber-50 border-amber-200">
                                      <CardContent className="p-3">
                                        <div className="font-medium text-sm">{flag.rule_name}</div>
                                        <div className="text-xs text-gray-700 mt-1">{flag.ambiguity_note}</div>
                                        <div className="text-xs text-gray-600 mt-1">Confidence: {flag.confidence_score}%</div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {msg.response?.metadata?.agent_name || 'Compliance Manager'}
                      </Badge>
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center gap-2 text-gray-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(action)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
            >
              {action}
            </button>
          ))}
        </div>

        {file && (
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
            <FileText className="h-4 w-4" />
            {file.name}
            <button onClick={() => setFile(null)} className="ml-auto text-gray-500 hover:text-gray-700">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Ask about compliance rules, upload PDF, or check portfolio status..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={loading || (!input.trim() && !file)}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Component: Compliance Dashboard
function ComplianceDashboard({
  versions,
  selectedVersion,
  onVersionChange
}: {
  versions: Version[]
  selectedVersion: string
  onVersionChange: (versionId: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showAmbiguity, setShowAmbiguity] = useState(true)

  const currentVersion = versions.find(v => v.id === selectedVersion)

  const filteredRules = currentVersion?.rules.filter(rule => {
    const matchesSearch = rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.rule_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'All' || rule.rule_type === filterType
    return matchesSearch && matchesFilter
  }) || []

  const toggleRow = (ruleId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId)
    } else {
      newExpanded.add(ruleId)
    }
    setExpandedRows(newExpanded)
  }

  // Mock compliance data (would come from API)
  const mockComplianceScore = 73
  const mockBreaches: BreachReport[] = [
    {
      fund_name: 'China Growth Fund',
      rule_violated: 'Cash Holdings Limit',
      rule_id: 'R001',
      current_portfolio_value: '12%',
      rule_limit: '10%',
      variance_percentage: '+2%',
      severity_level: 'Medium',
      root_cause_analysis: 'Recent redemptions increased cash position',
      remediation_suggestion: 'Deploy $2.4M into equity positions'
    },
    {
      fund_name: 'Global Bond Fund',
      rule_violated: 'Credit Rating Floor',
      rule_id: 'R004',
      current_portfolio_value: 'BB+',
      rule_limit: 'BBB-',
      variance_percentage: 'N/A',
      severity_level: 'High',
      root_cause_analysis: 'Issuer downgrade from BBB- to BB+',
      remediation_suggestion: 'Divest $5.1M BB+ rated holding'
    }
  ]

  const handleExport = (format: 'csv' | 'pdf') => {
    alert(`Exporting to ${format.toUpperCase()}... (Feature in development)`)
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Select value={selectedVersion} onValueChange={onVersionChange}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {versions.map(v => (
              <SelectItem key={v.id} value={v.id}>
                {v.version} - {v.filename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* LEFT: Extracted Rules */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Extracted Rules</CardTitle>
              <CardDescription>
                {currentVersion?.ruleCount} rules from {currentVersion?.filename}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search rules..."
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2">
                  {['All', 'Limit', 'Restriction', 'Requirement'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        filterType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRules.map(rule => (
                      <>
                        <TableRow key={rule.rule_id} className="cursor-pointer" onClick={() => toggleRow(rule.rule_id)}>
                          <TableCell className="font-mono text-xs">{rule.rule_id}</TableCell>
                          <TableCell>
                            {rule.rule_name}
                            {rule.ambiguous_flag && (
                              <AlertTriangle className="inline ml-1 h-3 w-3 text-amber-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.rule_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs ${
                              rule.confidence_score >= 90 ? 'text-green-600' :
                              rule.confidence_score >= 80 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {rule.confidence_score}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {expandedRows.has(rule.rule_id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(rule.rule_id) && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-gray-50">
                              <div className="p-3 text-sm space-y-2">
                                <div><span className="font-semibold">Threshold:</span> {rule.value_threshold}</div>
                                <div><span className="font-semibold">Applicable:</span> {rule.applicable_funds}</div>
                                <div><span className="font-semibold">Source:</span> {rule.source_section}</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Compliance Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Score</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ComplianceGauge score={mockComplianceScore} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Breaches</CardTitle>
              <CardDescription>{mockBreaches.length} violations detected</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBreaches.map((breach, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{breach.fund_name}</TableCell>
                      <TableCell className="text-sm">{breach.rule_violated}</TableCell>
                      <TableCell>
                        <SeverityBadge severity={breach.severity_level} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 bg-red-50 rounded">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className="font-medium">High Priority</div>
                    <div className="text-gray-700">Divest $5.1M sub-investment grade holding</div>
                    <div className="text-xs text-gray-600 mt-1">Timeline: Within 2 business days</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-amber-50 rounded">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className="font-medium">Medium Priority</div>
                    <div className="text-gray-700">Deploy $2.4M excess cash</div>
                    <div className="text-xs text-gray-600 mt-1">Timeline: Within 5 business days</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {showAmbiguity && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Ambiguity Review
                  </CardTitle>
                  <button onClick={() => setShowAmbiguity(false)} className="text-gray-500 hover:text-gray-700">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div className="font-medium">Credit Rating Floor (R004)</div>
                  <div className="text-xs mt-1">
                    Please verify: Does 'investment grade' include BBB- or only BBB and above?
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Confidence: 78%</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Component: Version Control
function VersionControl({ versions }: { versions: Version[] }) {
  const [selectedVersion, setSelectedVersion] = useState(versions[0].id)
  const [compareMode, setCompareMode] = useState(false)
  const [compareV1, setCompareV1] = useState(versions[0].id)
  const [compareV2, setCompareV2] = useState(versions[1]?.id || versions[0].id)
  const [diffView, setDiffView] = useState<'side-by-side' | 'unified'>('side-by-side')

  const currentVersion = versions.find(v => v.id === selectedVersion)

  const getDiff = () => {
    const v1 = versions.find(v => v.id === compareV1)
    const v2 = versions.find(v => v.id === compareV2)

    if (!v1 || !v2) return { added: [], removed: [], modified: [] }

    const v1RuleIds = new Set(v1.rules.map(r => r.rule_id))
    const v2RuleIds = new Set(v2.rules.map(r => r.rule_id))

    const added = v2.rules.filter(r => !v1RuleIds.has(r.rule_id))
    const removed = v1.rules.filter(r => !v2RuleIds.has(r.rule_id))
    const modified = v2.rules.filter(r => {
      const v1Rule = v1.rules.find(r1 => r1.rule_id === r.rule_id)
      return v1Rule && (
        v1Rule.value_threshold !== r.value_threshold ||
        v1Rule.rule_name !== r.rule_name
      )
    })

    return { added, removed, modified }
  }

  const diff = compareMode ? getDiff() : { added: [], removed: [], modified: [] }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Version History</h2>
        <Button
          variant={compareMode ? 'default' : 'outline'}
          onClick={() => setCompareMode(!compareMode)}
        >
          {compareMode ? 'Exit Compare Mode' : 'Compare Versions'}
        </Button>
      </div>

      {compareMode ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={compareV1} onValueChange={setCompareV1}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-gray-600">vs</span>

            <Select value={compareV2} onValueChange={setCompareV2}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant={diffView === 'side-by-side' ? 'default' : 'outline'}
                onClick={() => setDiffView('side-by-side')}
              >
                Side-by-Side
              </Button>
              <Button
                size="sm"
                variant={diffView === 'unified' ? 'default' : 'outline'}
                onClick={() => setDiffView('unified')}
              >
                Unified
              </Button>
            </div>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>{diff.added.length} Added</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>{diff.removed.length} Removed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 rounded"></div>
                  <span>{diff.modified.length} Modified</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diff.added.map(rule => (
                  <div key={rule.rule_id} className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">Added</Badge>
                      <span className="font-mono text-sm">{rule.rule_id}</span>
                      <span className="font-medium">{rule.rule_name}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{rule.value_threshold}</div>
                  </div>
                ))}

                {diff.removed.map(rule => (
                  <div key={rule.rule_id} className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600">Removed</Badge>
                      <span className="font-mono text-sm">{rule.rule_id}</span>
                      <span className="font-medium">{rule.rule_name}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{rule.value_threshold}</div>
                  </div>
                ))}

                {diff.modified.map(rule => {
                  const v1 = versions.find(v => v.id === compareV1)
                  const oldRule = v1?.rules.find(r => r.rule_id === rule.rule_id)
                  return (
                    <div key={rule.rule_id} className="p-3 bg-amber-50 border border-amber-200 rounded">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500">Modified</Badge>
                        <span className="font-mono text-sm">{rule.rule_id}</span>
                        <span className="font-medium">{rule.rule_name}</span>
                      </div>
                      <div className="text-sm mt-1 space-y-1">
                        <div className="text-red-600 line-through">{oldRule?.value_threshold}</div>
                        <div className="text-green-600">{rule.value_threshold}</div>
                      </div>
                    </div>
                  )
                })}

                {diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No changes detected</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {/* LEFT: Timeline */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">All Versions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {versions.map((v, idx) => (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVersion(v.id)}
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          selectedVersion === v.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={idx === 0 ? 'default' : 'outline'} className={selectedVersion === v.id ? 'bg-blue-800' : ''}>
                            {v.version}
                          </Badge>
                          {idx === 0 && (
                            <span className="text-xs">Latest</span>
                          )}
                        </div>
                        <div className="text-xs mt-1 opacity-90">{v.filename}</div>
                        <div className="text-xs mt-1 opacity-75">
                          {v.uploadDate.toLocaleDateString()}
                        </div>
                        <div className="text-xs mt-1 opacity-75">
                          {v.ruleCount} rules
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Version Detail */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Version Details: {currentVersion?.version}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Filename</div>
                      <div className="font-medium">{currentVersion?.filename}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Upload Date</div>
                      <div className="font-medium">{currentVersion?.uploadDate.toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Uploader</div>
                      <div className="font-medium">{currentVersion?.uploader}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">File Size</div>
                      <div className="font-medium">{currentVersion?.fileSize}</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Compliance Status
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Original PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Extracted Rules ({currentVersion?.ruleCount})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Applicable Funds</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentVersion?.rules.map(rule => (
                      <TableRow key={rule.rule_id}>
                        <TableCell className="font-mono text-xs">{rule.rule_id}</TableCell>
                        <TableCell>
                          {rule.rule_name}
                          {rule.ambiguous_flag && (
                            <AlertTriangle className="inline ml-1 h-3 w-3 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.rule_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{rule.value_threshold}</TableCell>
                        <TableCell className="text-sm">{rule.applicable_funds}</TableCell>
                        <TableCell>
                          <span className={`text-xs ${
                            rule.confidence_score >= 90 ? 'text-green-600' :
                            rule.confidence_score >= 80 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {rule.confidence_score}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

// Component: Portfolio Database
function PortfolioDatabase() {
  const [selectedFund, setSelectedFund] = useState<keyof typeof mockPortfolios>('China Growth Fund')

  const holdings = mockPortfolios[selectedFund]

  const calculateSummary = (holdings: Holding[]) => {
    const cash = holdings.find(h => h.assetClass === 'Cash')?.weight || 0
    const equities = holdings.filter(h => h.assetClass === 'Equity').reduce((sum, h) => sum + h.weight, 0)
    const bonds = holdings.filter(h => h.assetClass === 'Bond').reduce((sum, h) => sum + h.weight, 0)
    const totalHoldings = holdings.length

    return { cash, equities, bonds, totalHoldings }
  }

  const summary = calculateSummary(holdings)

  return (
    <div className="p-6">
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
        <AlertTriangle className="inline h-4 w-4 mr-2" />
        POC: Mock portfolio data for demonstration purposes only
      </div>

      <div className="flex items-center justify-between mb-4">
        <Tabs value={selectedFund} onValueChange={(v) => setSelectedFund(v as keyof typeof mockPortfolios)} className="w-full">
          <TabsList>
            <TabsTrigger value="China Growth Fund">China Growth Fund</TabsTrigger>
            <TabsTrigger value="Global Bond Fund">Global Bond Fund</TabsTrigger>
            <TabsTrigger value="Emerging Markets Fund">Emerging Markets Fund</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="outline" className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync with Chat Agent
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Holdings - {selectedFund}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Class</TableHead>
                    <TableHead>Holding Name</TableHead>
                    <TableHead>Weight %</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Country</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant={holding.assetClass === 'Cash' ? 'secondary' : 'outline'}>
                          {holding.assetClass}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{holding.holdingName}</TableCell>
                      <TableCell className="font-mono">{holding.weight.toFixed(1)}%</TableCell>
                      <TableCell>{holding.sector}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          holding.rating.startsWith('AA') ? 'bg-green-50 text-green-700' :
                          holding.rating.startsWith('A') ? 'bg-blue-50 text-blue-700' :
                          holding.rating.startsWith('BBB') ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }>
                          {holding.rating}
                        </Badge>
                      </TableCell>
                      <TableCell>{holding.country}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-gray-600">Cash %</div>
                <div className="text-2xl font-bold">{summary.cash.toFixed(1)}%</div>
                <Progress value={summary.cash} className="mt-1" />
              </div>

              <Separator />

              <div>
                <div className="text-xs text-gray-600">Equities %</div>
                <div className="text-xl font-bold">{summary.equities.toFixed(1)}%</div>
              </div>

              <div>
                <div className="text-xs text-gray-600">Bonds %</div>
                <div className="text-xl font-bold">{summary.bonds.toFixed(1)}%</div>
              </div>

              <Separator />

              <div>
                <div className="text-xs text-gray-600">Total Holdings</div>
                <div className="text-xl font-bold">{summary.totalHoldings}</div>
              </div>

              <div>
                <div className="text-xs text-gray-600">Avg Rating</div>
                <div className="text-lg font-bold">A-</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="text-xs text-gray-600 mb-1">Quick Stats</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Compliance Score</span>
                  <span className="font-bold text-amber-600">73%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Active Breaches</span>
                  <span className="font-bold text-red-600">2</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Main Home Component
export default function Home() {
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(mockVersions[0].id)

  const handleSendMessage = async (content: string, file?: File) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: file ? `${content} [Attached: ${file.name}]` : content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      // Determine which agent to call based on message content
      let agentId = COMPLIANCE_MANAGER_AGENT_ID

      if (content.toLowerCase().includes('extract') || file) {
        agentId = RULE_EXTRACTION_AGENT_ID
      } else if (content.toLowerCase().includes('check') || content.toLowerCase().includes('compliance')) {
        agentId = COMPLIANCE_CHECKER_AGENT_ID
      }

      const result = await callAIAgent(content, agentId)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        response: result.response
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling agent:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a365d] text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">GSAM Compliance Agent</h1>
          <p className="text-sm text-gray-300">AI-Powered Investment Guideline Compliance Platform</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chat">Chat Interface</TabsTrigger>
            <TabsTrigger value="dashboard">Compliance Dashboard</TabsTrigger>
            <TabsTrigger value="versions">Version Control</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio Database</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <Card className="shadow-lg">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
              />
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0">
            <ComplianceDashboard
              versions={mockVersions}
              selectedVersion={selectedVersion}
              onVersionChange={setSelectedVersion}
            />
          </TabsContent>

          <TabsContent value="versions" className="mt-0">
            <VersionControl versions={mockVersions} />
          </TabsContent>

          <TabsContent value="portfolio" className="mt-0">
            <PortfolioDatabase />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
