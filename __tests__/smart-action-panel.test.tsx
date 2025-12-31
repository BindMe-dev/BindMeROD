import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SmartActionPanel } from '@/components/smart-action-panel'
import type { Agreement } from '@/lib/agreement-types'
import type { AvailableActions } from '@/lib/agreement-actions'

// Mock the dialog components
jest.mock('@/components/agreement/dialogs/withdraw-dialog', () => ({
  WithdrawDialog: ({ triggerId }: { triggerId: string }) => (
    <div data-testid="withdraw-dialog">{triggerId}</div>
  ),
}))

jest.mock('@/components/agreement/dialogs/terminate-dialog', () => ({
  TerminateDialog: ({ triggerId }: { triggerId: string }) => (
    <div data-testid="terminate-dialog">{triggerId}</div>
  ),
}))

jest.mock('@/components/agreement/dialogs/breach-report-dialog', () => ({
  BreachReportDialog: ({ triggerId }: { triggerId: string }) => (
    <div data-testid="breach-report-dialog">{triggerId}</div>
  ),
}))

jest.mock('@/components/agreement/dialogs/breach-response-dialog', () => ({
  BreachResponseDialog: ({ triggerId }: { triggerId: string }) => (
    <div data-testid="breach-response-dialog">{triggerId}</div>
  ),
}))

jest.mock('@/components/amendment-request-dialog', () => ({
  AmendmentRequestDialog: ({ agreementId, trigger }: { agreementId: string; trigger: React.ReactNode }) => (
    <div data-testid="amendment-request-dialog">
      {agreementId}
      {trigger}
    </div>
  ),
}))

describe('SmartActionPanel', () => {
  const mockAgreement: Agreement = {
    id: 'test-agreement-1',
    title: 'Test Agreement',
    description: 'Test Description',
    status: 'draft',
    type: 'single',
    createdBy: 'user-1',
    counterparty: 'user-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    legal: {
      signatures: [],
    },
  } as Agreement

  const mockActions: AvailableActions = {
    canEdit: true,
    canDelete: true,
    canSignAsCreator: false,
    canSignAsCounterparty: false,
    canComplete: false,
    canSendForSignature: false,
    canCancel: false,
    canReject: false,
    canWithdraw: false,
    canRequestCompletion: false,
    canConfirmCompletion: false,
    canDuplicate: false,
    canViewAudit: false,
    canDownloadReceipt: false,
    canTerminate: false,
    canReportBreach: false,
    canRespondToBreach: false,
    canRequestAmendment: false,
    canResend: false,
    canSign: false,
    canCreatorSign: false,
    canSetExpiration: false,
    canCancelDraft: false,
    canWithdrawOffer: false,
    canRejectCompletion: false,
    canRaiseDispute: false,
    canTerminateAgreement: false,
    canWithdrawBreachReport: false,
    canAcceptAmendment: false,
    canRejectAmendment: false,
    canCounterProposeAmendment: false,
    canCancelAmendmentRequest: false,
    canReviseAmendment: false,
    canDiscussAmendment: false,
    canProvideEvidence: false,
    canProvideCounterEvidence: false,
    canDisputeRejection: false,
    canAcknowledgeBreach: false,
    canEscalateImmediately: false,
    canEscalateToLegal: false,
    canProposeResolution: false,
    canAcceptResolution: false,
    canRequestMediation: false,
    canSubmitCounterProposal: false,
    canMarkSettled: false,
    canMarkTerminated: false,
    canUploadLegalDocuments: false,
    canResendExpired: false,
    canExportPDF: false,
    canAddComments: false,
    canViewHistory: false,
    canViewVersions: false,
    reasons: {},
    warnings: {},
  }

  const defaultProps = {
    agreement: mockAgreement,
    userId: 'user-1',
    isCreator: true,
    isCounterpartyUser: false,
    actions: mockActions,
    counterpartySignatures: [],
    onComplete: jest.fn(),
    onSignAsCounterparty: jest.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<SmartActionPanel {...defaultProps} />)
    expect(container).toBeInTheDocument()
  })

  it('accepts creatorSignTriggerId prop without error', () => {
    const creatorSignTriggerId = 'creator-sign-trigger-123'
    const { container } = render(
      <SmartActionPanel
        {...defaultProps}
        creatorSignTriggerId={creatorSignTriggerId}
      />
    )
    // Component should render successfully
    expect(container).toBeInTheDocument()
  })

  it('accepts onRefresh prop without error', () => {
    const onRefresh = jest.fn()
    const { container } = render(
      <SmartActionPanel
        {...defaultProps}
        onRefresh={onRefresh}
      />
    )
    // Component should render successfully
    expect(container).toBeInTheDocument()
  })

  it('accepts onResend prop without error', () => {
    const onResend = jest.fn()
    const { container } = render(
      <SmartActionPanel
        {...defaultProps}
        onResend={onResend}
      />
    )
    // Component should render successfully
    expect(container).toBeInTheDocument()
  })

  it('renders with all new props combined', () => {
    const onRefresh = jest.fn()
    const onResend = jest.fn()
    const creatorSignTriggerId = 'creator-sign-trigger-123'
    
    const { container } = render(
      <SmartActionPanel
        {...defaultProps}
        creatorSignTriggerId={creatorSignTriggerId}
        onRefresh={onRefresh}
        onResend={onResend}
      />
    )
    
    // Component should render successfully with all props
    expect(container).toBeInTheDocument()
  })

  it('renders amendment request dialog when canRequestAmendment is true', () => {
    const onRefresh = jest.fn()
    const actionsWithAmendment = {
      ...mockActions,
      canRequestAmendment: true,
    }

    render(
      <SmartActionPanel
        {...defaultProps}
        actions={actionsWithAmendment}
        onRefresh={onRefresh}
      />
    )
    
    // Amendment dialog should be rendered
    expect(screen.getByTestId('amendment-request-dialog')).toBeInTheDocument()
  })

  it('handles agreement awaiting counterparty signature', () => {
    const awaitingSignatureAgreement = {
      ...mockAgreement,
      status: 'awaiting_counterparty_signature' as const,
    }

    const actionsForSigning = {
      ...mockActions,
      canSign: true,
    }

    const { container } = render(
      <SmartActionPanel
        {...defaultProps}
        agreement={awaitingSignatureAgreement}
        actions={actionsForSigning}
        isCounterpartyUser={true}
        counterpartySignTriggerId="counterparty-sign-trigger"
      />
    )
    
    // Should render without errors
    expect(container).toBeInTheDocument()
  })

  it('handles agreement awaiting creator signature', () => {
    const awaitingCreatorSignatureAgreement = {
      ...mockAgreement,
      status: 'awaiting_creator_signature' as const,
    }

    const actionsForCreatorSigning = {
      ...mockActions,
      canCreatorSign: true,
    }

    const onSignAsCreator = jest.fn()
    const creatorSignTriggerId = 'creator-sign-trigger-123'

    const { container } = render(
      <SmartActionPanel
        {...defaultProps}
        agreement={awaitingCreatorSignatureAgreement}
        actions={actionsForCreatorSigning}
        onSignAsCreator={onSignAsCreator}
        creatorSignTriggerId={creatorSignTriggerId}
      />
    )
    
    // Should render successfully with creator signature capability
    expect(container).toBeInTheDocument()
  })

  it('handles completed agreement', () => {
    const completedAgreement = {
      ...mockAgreement,
      status: 'completed' as const,
    }

    const completedActions = {
      ...mockActions,
      canDownloadReceipt: true,
      canDuplicate: true,
      canViewAudit: true,
    }

    const { container } = render(
      <SmartActionPanel
        {...defaultProps}
        agreement={completedAgreement}
        actions={completedActions}
        onDownloadReceipt={jest.fn()}
        onDuplicate={jest.fn()}
        onViewAudit={jest.fn()}
      />
    )
    
    // Should render completed agreement
    expect(container).toBeInTheDocument()
  })
})
