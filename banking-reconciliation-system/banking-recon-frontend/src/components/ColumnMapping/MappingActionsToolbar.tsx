import React, { useState } from 'react';
import { Button, Space, Tooltip, Modal, message, Dropdown, Menu } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  ClearOutlined,
  SwapOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { DetectedColumn, ColumnMapping } from '../../services/dataPrepService';
import { MappingHistoryManager } from '../../utils/mappingHistory';
import {
  mapAllRequired,
  mapAllAuto,
  clearAllMappings,
  swapDebitCredit,
  mergeMappings,
} from '../../utils/mappingOperations';

interface MappingActionsToolbarProps {
  mappings: ColumnMapping[];
  detectedColumns: DetectedColumn[];
  historyManager: MappingHistoryManager;
  onMappingsChange: (mappings: ColumnMapping[], description: string) => void;
  disabled?: boolean;
}

/**
 * Toolbar with quick actions for column mapping
 * Includes undo/redo, auto-mapping, clear, and bulk operations
 */
export const MappingActionsToolbar: React.FC<MappingActionsToolbarProps> = ({
  mappings,
  detectedColumns,
  historyManager,
  onMappingsChange,
  disabled = false,
}) => {
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    content: string;
    onConfirm: () => void;
  } | null>(null);

  const historyInfo = historyManager.getHistoryInfo();

  // Handle undo
  const handleUndo = () => {
    const previousMappings = historyManager.undo();
    if (previousMappings) {
      onMappingsChange(previousMappings, 'Undo');
      message.success('Undone');
    }
  };

  // Handle redo
  const handleRedo = () => {
    const nextMappings = historyManager.redo();
    if (nextMappings) {
      onMappingsChange(nextMappings, 'Redo');
      message.success('Redone');
    }
  };

  // Handle map all required
  const handleMapRequired = () => {
    const requiredMappings = mapAllRequired(detectedColumns);

    if (requiredMappings.length === 0) {
      message.warning('Could not auto-detect required fields. Please map manually.');
      return;
    }

    const merged = mergeMappings(mappings, requiredMappings);
    onMappingsChange(merged, 'Map Required Fields');
    message.success(`Mapped ${requiredMappings.length} required field(s)`);
  };

  // Handle auto-map all
  const handleMapAllAuto = () => {
    const autoMappings = mapAllAuto(detectedColumns);

    if (autoMappings.length === 0) {
      message.warning('Could not auto-map columns. Please map manually.');
      return;
    }

    onMappingsChange(autoMappings, 'Auto-Map All');
    message.success(`Auto-mapped ${autoMappings.length} column(s)`);
  };

  // Handle clear all with confirmation
  const handleClearAll = () => {
    setConfirmModal({
      visible: true,
      title: 'Clear All Mappings?',
      content: 'This will remove all column mappings. This action can be undone.',
      onConfirm: () => {
        onMappingsChange(clearAllMappings(), 'Clear All');
        message.success('All mappings cleared');
        setConfirmModal(null);
      },
    });
  };

  // Handle swap debit/credit
  const handleSwapDebitCredit = () => {
    const hasDebit = mappings.some((m) => m.targetField === 'debit');
    const hasCredit = mappings.some((m) => m.targetField === 'credit');

    if (!hasDebit || !hasCredit) {
      message.warning('Both debit and credit columns must be mapped to swap');
      return;
    }

    const swapped = swapDebitCredit(mappings);
    onMappingsChange(swapped, 'Swap Debit/Credit');
    message.success('Swapped debit and credit mappings');
  };

  // Quick actions menu
  const quickActionsMenu = (
    <Menu>
      <Menu.Item
        key="map_required"
        icon={<ThunderboltOutlined />}
        onClick={handleMapRequired}
        disabled={disabled}
      >
        Map Required Fields
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
          Auto-map date, amount, description
        </div>
      </Menu.Item>
      <Menu.Item
        key="map_all_auto"
        icon={<RocketOutlined />}
        onClick={handleMapAllAuto}
        disabled={disabled}
      >
        Auto-Map All Columns
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
          Map all columns to best matches
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="swap_debit_credit"
        icon={<SwapOutlined />}
        onClick={handleSwapDebitCredit}
        disabled={disabled}
      >
        Swap Debit/Credit
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
          Swap debit and credit columns
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="clear_all"
        icon={<ClearOutlined />}
        onClick={handleClearAll}
        disabled={disabled}
        danger
      >
        Clear All Mappings
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
          Remove all mappings
        </div>
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Space size="middle">
        {/* Undo/Redo */}
        <Space.Compact>
          <Tooltip
            title={
              historyInfo.canUndo
                ? `Undo: ${historyManager.getUndoDescription()}`
                : 'Nothing to undo'
            }
          >
            <Button
              icon={<UndoOutlined />}
              onClick={handleUndo}
              disabled={!historyInfo.canUndo || disabled}
            >
              Undo
            </Button>
          </Tooltip>
          <Tooltip
            title={
              historyInfo.canRedo
                ? `Redo: ${historyManager.getRedoDescription()}`
                : 'Nothing to redo'
            }
          >
            <Button
              icon={<RedoOutlined />}
              onClick={handleRedo}
              disabled={!historyInfo.canRedo || disabled}
            >
              Redo
            </Button>
          </Tooltip>
        </Space.Compact>

        {/* Quick Actions Dropdown */}
        <Dropdown overlay={quickActionsMenu} disabled={disabled}>
          <Button type="primary">
            Quick Actions <DownOutlined />
          </Button>
        </Dropdown>
      </Space>

      {/* Confirmation Modal */}
      {confirmModal && (
        <Modal
          title={confirmModal.title}
          open={confirmModal.visible}
          onOk={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
          okText="Confirm"
          okButtonProps={{ danger: true }}
        >
          {confirmModal.content}
        </Modal>
      )}
    </>
  );
};
