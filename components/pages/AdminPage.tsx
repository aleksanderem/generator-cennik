import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Settings,
  FileText,
  Save,
  Plus,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface PromptTemplate {
  _id: Id<"promptTemplates">;
  stage: string;
  displayName: string;
  description: string;
  promptContent: string;
  rules?: string[];
  examples?: { before: string; after: string }[];
  temperature?: number;
  maxTokens?: number;
  updatedAt: number;
  version: number;
  isActive: boolean;
}

const AdminPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const clerkId = user?.id || '';

  // Check admin status
  const isAdmin = useQuery(api.admin.checkIsAdmin, { clerkId }) ?? false;

  // Get prompt templates
  const templates = useQuery(api.admin.listPromptTemplates, { clerkId }) ?? [];

  // Get users list
  const users = useQuery(api.admin.listUsers, { clerkId }) ?? [];

  // Mutations
  const setSelfAsAdmin = useMutation(api.admin.setSelfAsAdmin);
  const upsertTemplate = useMutation(api.admin.upsertPromptTemplate);
  const deleteTemplate = useMutation(api.admin.deletePromptTemplate);
  const setUserRole = useMutation(api.admin.setUserRole);

  // Local state
  const [activeTab, setActiveTab] = useState<'prompts' | 'users'>('prompts');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [newRule, setNewRule] = useState('');
  const [newExampleBefore, setNewExampleBefore] = useState('');
  const [newExampleAfter, setNewExampleAfter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New template form
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    stage: '',
    displayName: '',
    description: '',
    promptContent: '',
    temperature: 0.1,
    maxTokens: 4096,
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-700 mb-2">Panel Administratora</h1>
          <p className="text-slate-500">Zaloguj się, aby uzyskać dostęp</p>
        </div>
      </div>
    );
  }

  // Not admin - show option to become first admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <Shield className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-700 mb-2">Brak uprawnień</h1>
          <p className="text-slate-500 mb-6">
            Nie masz uprawnień administratora.
          </p>

          <button
            onClick={async () => {
              try {
                await setSelfAsAdmin({ clerkId });
                window.location.reload();
              } catch (err: any) {
                setError(err.message);
              }
            }}
            className="px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
          >
            Ustaw mnie jako pierwszego admina
          </button>

          {error && (
            <p className="mt-4 text-red-500 text-sm">{error}</p>
          )}

          <p className="text-xs text-slate-400 mt-4">
            Ta opcja działa tylko jeśli nie ma jeszcze żadnego admina w systemie.
          </p>
        </div>
      </div>
    );
  }

  // Save template changes
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setIsSaving(true);
    setError(null);

    try {
      await upsertTemplate({
        clerkId,
        stage: editingTemplate.stage,
        displayName: editingTemplate.displayName,
        description: editingTemplate.description,
        promptContent: editingTemplate.promptContent,
        rules: editingTemplate.rules,
        examples: editingTemplate.examples,
        temperature: editingTemplate.temperature,
        maxTokens: editingTemplate.maxTokens,
        isActive: editingTemplate.isActive,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setEditingTemplate(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Create new template
  const handleCreateTemplate = async () => {
    if (!newTemplate.stage || !newTemplate.displayName) {
      setError('Stage i nazwa są wymagane');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await upsertTemplate({
        clerkId,
        ...newTemplate,
        isActive: true,
      });

      setIsCreatingNew(false);
      setNewTemplate({
        stage: '',
        displayName: '',
        description: '',
        promptContent: '',
        temperature: 0.1,
        maxTokens: 4096,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: Id<"promptTemplates">) => {
    if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;

    try {
      await deleteTemplate({ clerkId, templateId });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Add rule to editing template
  const addRule = () => {
    if (!newRule.trim() || !editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      rules: [...(editingTemplate.rules || []), newRule.trim()],
    });
    setNewRule('');
  };

  // Remove rule
  const removeRule = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      rules: editingTemplate.rules?.filter((_, i) => i !== index),
    });
  };

  // Add example
  const addExample = () => {
    if (!newExampleBefore.trim() || !newExampleAfter.trim() || !editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      examples: [
        ...(editingTemplate.examples || []),
        { before: newExampleBefore.trim(), after: newExampleAfter.trim() },
      ],
    });
    setNewExampleBefore('');
    setNewExampleAfter('');
  };

  // Remove example
  const removeExample = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      examples: editingTemplate.examples?.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Panel Administratora</h1>
              <p className="text-sm text-slate-500">Zarządzaj promptami i użytkownikami</p>
            </div>
          </div>
        </div>

        {/* Success/Error messages */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700">Zapisano pomyślnie!</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'prompts'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Prompty ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Użytkownicy ({users.length})
          </button>
        </div>

        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="space-y-4">
            {/* Add new button */}
            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Dodaj nowy szablon prompta
            </button>

            {/* New template form */}
            {isCreatingNew && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-xl shadow-lg p-6 border border-amber-200"
              >
                <h3 className="font-bold text-lg mb-4">Nowy szablon prompta</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Stage (ID)</label>
                    <input
                      type="text"
                      value={newTemplate.stage}
                      onChange={(e) => setNewTemplate({ ...newTemplate, stage: e.target.value })}
                      placeholder="np. optimization_seo"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Nazwa wyświetlana</label>
                    <input
                      type="text"
                      value={newTemplate.displayName}
                      onChange={(e) => setNewTemplate({ ...newTemplate, displayName: e.target.value })}
                      placeholder="np. SEO - Słowa kluczowe"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Opis</label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Co robi ten prompt..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Treść prompta</label>
                  <textarea
                    value={newTemplate.promptContent}
                    onChange={(e) => setNewTemplate({ ...newTemplate, promptContent: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
                    placeholder="Wpisz treść prompta..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Temperatura (0-1)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={newTemplate.temperature}
                      onChange={(e) => setNewTemplate({ ...newTemplate, temperature: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Max tokenów</label>
                    <input
                      type="number"
                      value={newTemplate.maxTokens}
                      onChange={(e) => setNewTemplate({ ...newTemplate, maxTokens: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateTemplate}
                    disabled={isSaving}
                    className="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Utwórz
                  </button>
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200"
                  >
                    Anuluj
                  </button>
                </div>
              </motion.div>
            )}

            {/* Existing templates */}
            {templates.map((template) => (
              <div
                key={template._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedTemplate(expandedTemplate === template._id ? null : template._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <div>
                      <h3 className="font-semibold text-slate-800">{template.displayName}</h3>
                      <p className="text-sm text-slate-500">{template.stage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">v{template.version}</span>
                    {expandedTemplate === template._id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {expandedTemplate === template._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-4 space-y-4">
                        <p className="text-sm text-slate-600">{template.description}</p>

                        {/* Edit mode */}
                        {editingTemplate?._id === template._id ? (
                          <div className="space-y-4">
                            {/* Prompt content */}
                            <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Treść prompta</label>
                              <textarea
                                value={editingTemplate.promptContent}
                                onChange={(e) => setEditingTemplate({
                                  ...editingTemplate,
                                  promptContent: e.target.value,
                                })}
                                rows={12}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
                              />
                            </div>

                            {/* Rules */}
                            <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Zasady</label>
                              <div className="space-y-2 mb-2">
                                {editingTemplate.rules?.map((rule, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                    <span className="flex-1 text-sm">{rule}</span>
                                    <button
                                      onClick={() => removeRule(idx)}
                                      className="text-red-400 hover:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newRule}
                                  onChange={(e) => setNewRule(e.target.value)}
                                  placeholder="Dodaj nową zasadę..."
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                  onKeyDown={(e) => e.key === 'Enter' && addRule()}
                                />
                                <button
                                  onClick={addRule}
                                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Examples */}
                            <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Przykłady transformacji</label>
                              <div className="space-y-2 mb-2">
                                {editingTemplate.examples?.map((ex, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg text-sm">
                                    <span className="text-red-500 line-through">{ex.before}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="text-green-600">{ex.after}</span>
                                    <button
                                      onClick={() => removeExample(idx)}
                                      className="ml-auto text-red-400 hover:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newExampleBefore}
                                  onChange={(e) => setNewExampleBefore(e.target.value)}
                                  placeholder="Przed..."
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                                <input
                                  type="text"
                                  value={newExampleAfter}
                                  onChange={(e) => setNewExampleAfter(e.target.value)}
                                  placeholder="Po..."
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                                <button
                                  onClick={addExample}
                                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Temperature & Max tokens */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Temperatura</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="1"
                                  value={editingTemplate.temperature ?? 0.1}
                                  onChange={(e) => setEditingTemplate({
                                    ...editingTemplate,
                                    temperature: parseFloat(e.target.value),
                                  })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Max tokenów</label>
                                <input
                                  type="number"
                                  value={editingTemplate.maxTokens ?? 4096}
                                  onChange={(e) => setEditingTemplate({
                                    ...editingTemplate,
                                    maxTokens: parseInt(e.target.value),
                                  })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                />
                              </div>
                            </div>

                            {/* Active toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingTemplate.isActive}
                                onChange={(e) => setEditingTemplate({
                                  ...editingTemplate,
                                  isActive: e.target.checked,
                                })}
                                className="w-4 h-4 rounded border-slate-300"
                              />
                              <span className="text-sm text-slate-600">Aktywny</span>
                            </label>

                            {/* Save/Cancel buttons */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                              <button
                                onClick={handleSaveTemplate}
                                disabled={isSaving}
                                className="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Zapisz zmiany
                              </button>
                              <button
                                onClick={() => setEditingTemplate(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200"
                              >
                                Anuluj
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template._id)}
                                className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 ml-auto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg">
                              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                                {template.promptContent}
                              </pre>
                            </div>

                            {template.rules && template.rules.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-2">Zasady:</h4>
                                <ul className="space-y-1">
                                  {template.rules.map((rule, idx) => (
                                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                      {rule}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {template.examples && template.examples.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-2">Przykłady:</h4>
                                <div className="space-y-2">
                                  {template.examples.map((ex, idx) => (
                                    <div key={idx} className="text-sm flex items-center gap-2">
                                      <span className="text-red-500 line-through">{ex.before}</span>
                                      <span className="text-slate-400">→</span>
                                      <span className="text-green-600">{ex.after}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-4 text-sm text-slate-500">
                              <span>Temperatura: {template.temperature ?? 0.1}</span>
                              <span>Max tokenów: {template.maxTokens ?? 4096}</span>
                            </div>

                            <button
                              onClick={() => setEditingTemplate(template)}
                              className="px-4 py-2 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200"
                            >
                              <Settings className="w-4 h-4 inline mr-2" />
                              Edytuj
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {templates.length === 0 && !isCreatingNew && (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Brak szablonów promptów</p>
                <p className="text-sm">Kliknij przycisk powyżej, aby dodać pierwszy</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nazwa</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rola</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Kredyty</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-sm">{u.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.credits}</td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button
                          onClick={async () => {
                            try {
                              await setUserRole({
                                adminClerkId: clerkId,
                                targetUserId: u._id,
                                role: 'admin',
                              });
                            } catch (err: any) {
                              setError(err.message);
                            }
                          }}
                          className="text-xs text-amber-600 hover:text-amber-800"
                        >
                          Nadaj admina
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Brak użytkowników</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
