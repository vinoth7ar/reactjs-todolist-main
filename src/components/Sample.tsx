// ============================================================================
// SINGLE VIEW - ALL IN ONE FILE
// ============================================================================
// This file contains the complete SingleView functionality.
// It can be split into separate files later using the comment sections below.

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowLeft, Settings, ArrowRight } from 'lucide-react';
import { mockWorkflows } from '@/components/workflow/mock-data';
import { WorkflowData, LayoutConfig } from '@/components/workflow/types';
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';

// ============================================================================
// TYPES SECTION - Move to: src/components/SingleView/types.ts
// ============================================================================

export interface SelectionState {
  selectedType: 'workflow' | 'entity' | null;
  selectedId: string | null;
  customizations: ViewCustomizations;
}

export interface ViewCustomizations {
  expandAllEntities: boolean;
  showLegend: boolean;
  showMiniMap: boolean;
}

export interface WorkflowOption {
  id: string;
  title: string;
  description: string;
  category: 'workflow' | 'entity';
}

// ============================================================================
// CONTEXT SECTION - Move to: src/components/SingleView/context/SelectionContext.tsx
// ============================================================================

interface SelectionContextType {
  selection: SelectionState;
  updateSelection: (type: 'workflow' | 'entity', id: string) => void;
  updateCustomizations: (customizations: Partial<ViewCustomizations>) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

const defaultCustomizations: ViewCustomizations = {
  expandAllEntities: true,
  showLegend: true,
  showMiniMap: true,
};

const defaultSelection: SelectionState = {
  selectedType: null,
  selectedId: null,
  customizations: defaultCustomizations,
};

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<SelectionState>(defaultSelection);

  const updateSelection = (type: 'workflow' | 'entity', id: string) => {
    setSelection(prev => ({
      ...prev,
      selectedType: type,
      selectedId: id,
    }));
  };

  const updateCustomizations = (customizations: Partial<ViewCustomizations>) => {
    setSelection(prev => ({
      ...prev,
      customizations: { ...prev.customizations, ...customizations },
    }));
  };

  const clearSelection = () => {
    setSelection(defaultSelection);
  };

  return (
    <SelectionContext.Provider value={{
      selection,
      updateSelection,
      updateCustomizations,
      clearSelection,
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}

// ============================================================================
// HOOKS SECTION - Move to: src/components/SingleView/hooks/useWorkflowData.ts
// ============================================================================

// Backend integration hook
export function useWorkflowData(type: 'workflow' | 'entity' | null, id: string | null): WorkflowData | null {
  const [backendData, setBackendData] = useState<WorkflowData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch from backend
  const fetchWorkflowFromBackend = async (workflowId: string): Promise<WorkflowData | null> => {
    try {
      // TODO: Replace with actual backend API call
      // const response = await fetch(`/api/workflows/${workflowId}`);
      // const data = await response.json();
      // return data;
      
      // For now, simulate backend delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockWorkflows[workflowId] || null;
    } catch (err) {
      console.error('Failed to fetch workflow from backend:', err);
      return null;
    }
  };

  // Effect to load data when type/id changes
  useEffect(() => {
    if (!type || !id) {
      setBackendData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchWorkflowFromBackend(id)
      .then(data => {
        setBackendData(data);
        if (!data) {
          setError(`No ${type} found with id: ${id}`);
        }
      })
      .catch(err => {
        setError(err.message);
        setBackendData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [type, id]);

  return useMemo(() => {
    if (!type || !id) return null;
    
    // Return backend data if available, otherwise fallback to mock data
    return backendData || mockWorkflows[id] || null;
  }, [type, id, backendData]);
}

export function useAvailableOptions() {
  return useMemo(() => {
    // Convert mock workflows to selection options
    const workflowOptions = Object.entries(mockWorkflows).map(([id, data]) => ({
      id,
      title: data.workflow.title,
      description: data.workflow.description,
      category: 'workflow' as const,
    }));

    // For MVP, we only have workflows
    // In the future, add entity options here
    const entityOptions: any[] = [];

    return {
      workflows: workflowOptions,
      entities: entityOptions,
    };
  }, []);
}

// Hook to get available workflows for sidebar
export function useAvailableWorkflows() {
  return useMemo(() => {
    return Object.entries(mockWorkflows).map(([id, data]) => ({
      id,
      title: data.workflow.title,
      description: data.workflow.description,
    }));
  }, []);
}

// ============================================================================
// API SERVICE SECTION - Move to: src/components/SingleView/services/WorkflowAPI.ts
// ============================================================================

// Backend API service for workflow data
export class WorkflowAPI {
  private static baseURL = '/api'; // Configure your backend URL
  
  // Fetch workflow data by ID
  static async fetchWorkflow(workflowId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate that the response matches our WorkflowData interface
      if (!data.workflow || !data.stages || !data.statusNodes || !data.entities) {
        throw new Error('Invalid workflow data format from backend');
      }

      return data;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  }

  // Fetch all available workflows
  static async fetchAvailableWorkflows(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/workflows`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available workflows:', error);
      throw error;
    }
  }
}

// ============================================================================
// WORKFLOW SELECTOR COMPONENT - Move to: src/components/SingleView/components/WorkflowSelector.tsx
// ============================================================================

interface WorkflowSelectorProps {
  workflows: WorkflowOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function WorkflowSelector({ workflows, selectedId, onSelect }: WorkflowSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Workflows</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose up to one workflow to visualize (MVP)
        </p>
      </div>
      
      <div className="grid gap-3">
        {workflows.map((workflow) => (
          <Card 
            key={workflow.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedId === workflow.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'border-border hover:border-muted-foreground'
            }`}
            onClick={() => onSelect(workflow.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{workflow.title}</CardTitle>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedId === workflow.id 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground'
                }`} />
              </div>
              <CardDescription className="text-sm">
                {workflow.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ENTITY SELECTOR COMPONENT - Move to: src/components/SingleView/components/EntitySelector.tsx
// ============================================================================

interface EntitySelectorProps {
  entities: WorkflowOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function EntitySelector({ entities, selectedId, onSelect }: EntitySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Entities</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose up to one entity to visualize (MVP)
        </p>
      </div>
      
      {entities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <Badge variant="secondary" className="mb-2">Coming Soon</Badge>
              <p className="text-sm text-muted-foreground">
                Entity visualization will be available in a future release
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {entities.map((entity) => (
            <Card 
              key={entity.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedId === entity.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => onSelect(entity.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{entity.title}</CardTitle>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedId === entity.id 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground'
                  }`} />
                </div>
                <CardDescription className="text-sm">
                  {entity.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CUSTOMIZATION PANEL COMPONENT - Move to: src/components/SingleView/components/CustomizationPanel.tsx
// ============================================================================

interface CustomizationPanelProps {
  customizations: ViewCustomizations;
  onUpdate: (customizations: Partial<ViewCustomizations>) => void;
}

function CustomizationPanel({ customizations, onUpdate }: CustomizationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Customize View</CardTitle>
        <CardDescription>
          Configure how the workflow visualization will appear
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="expand-entities" className="text-sm font-medium">
              Expand All Entities
            </Label>
            <p className="text-xs text-muted-foreground">
              Show all entity details by default
            </p>
          </div>
          <Switch
            id="expand-entities"
            checked={customizations.expandAllEntities}
            onCheckedChange={(checked) => onUpdate({ expandAllEntities: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-legend" className="text-sm font-medium">
              Show Legend
            </Label>
            <p className="text-xs text-muted-foreground">
              Display legend panel in the visualization
            </p>
          </div>
          <Switch
            id="show-legend"
            checked={customizations.showLegend}
            onCheckedChange={(checked) => onUpdate({ showLegend: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-minimap" className="text-sm font-medium">
              Show Mini Map
            </Label>
            <p className="text-xs text-muted-foreground">
              Display navigation mini map
            </p>
          </div>
          <Switch
            id="show-minimap"
            checked={customizations.showMiniMap}
            onCheckedChange={(checked) => onUpdate({ showMiniMap: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SELECTION PAGE COMPONENT - Move to: src/components/SingleView/SelectionPage.tsx
// ============================================================================

export function SelectionPage() {
  const navigate = useNavigate();
  const { selection, updateSelection, updateCustomizations } = useSelection();
  const { workflows, entities } = useAvailableOptions();
  const [activeTab, setActiveTab] = useState<'workflows' | 'entities'>('workflows');

  const handleWorkflowSelect = (id: string) => {
    updateSelection('workflow', id);
    setActiveTab('workflows');
  };

  const handleEntitySelect = (id: string) => {
    updateSelection('entity', id);
    setActiveTab('entities');
  };

  const handleVisualize = () => {
    if (selection.selectedType && selection.selectedId) {
      navigate(`/visualization/${selection.selectedType}/${selection.selectedId}`);
    }
  };

  const canVisualize = selection.selectedType && selection.selectedId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Pipeline Management Framework</h1>
                <p className="text-sm text-muted-foreground">
                  Select a workflow or entity to visualize
                </p>
              </div>
            </div>
            <Button 
              onClick={handleVisualize}
              disabled={!canVisualize}
              className="gap-2"
              size="lg"
            >
              <Eye className="h-4 w-4" />
              Visualize
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selection Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'workflows' | 'entities')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="workflows">
                  Workflows ({workflows.length})
                </TabsTrigger>
                <TabsTrigger value="entities">
                  Entities ({entities.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="workflows" className="mt-6">
                <WorkflowSelector
                  workflows={workflows}
                  selectedId={selection.selectedType === 'workflow' ? selection.selectedId : null}
                  onSelect={handleWorkflowSelect}
                />
              </TabsContent>
              
              <TabsContent value="entities" className="mt-6">
                <EntitySelector
                  entities={entities}
                  selectedId={selection.selectedType === 'entity' ? selection.selectedId : null}
                  onSelect={handleEntitySelect}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Customization Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CustomizationPanel
                customizations={selection.customizations}
                onUpdate={updateCustomizations}
              />
              
              {/* Selection Summary */}
              {canVisualize && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Selected for Visualization:</h4>
                  <p className="text-sm">
                    <span className="capitalize">{selection.selectedType}:</span>{' '}
                    {selection.selectedType === 'workflow' 
                      ? workflows.find(w => w.id === selection.selectedId)?.title
                      : entities.find(e => e.id === selection.selectedId)?.title
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// VISUALIZATION PAGE COMPONENT - Move to: src/components/SingleView/VisualizationPage.tsx
// ============================================================================

export function VisualizationPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { selection, updateSelection } = useSelection();
  const availableWorkflows = useAvailableWorkflows();
  
  // Get workflow data based on URL params (handles backend integration)
  const workflowData = useWorkflowData(
    (type === 'workflow' || type === 'entity') ? type : null, 
    id || null
  );

  // Handle workflow switching from sidebar
  const handleWorkflowSelect = (workflowId: string) => {
    navigate(`/visualization/workflow/${workflowId}`);
  };

  // Sync URL params with selection context
  useEffect(() => {
    if (type && id && (type === 'workflow' || type === 'entity')) {
      if (selection.selectedType !== type || selection.selectedId !== id) {
        updateSelection(type, id);
      }
    }
  }, [type, id, selection.selectedType, selection.selectedId, updateSelection]);

  // Handle missing data
  if (!type || !id) {
    return (
      <div className="h-screen flex items-center justify-center bg-workflow-bg">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invalid URL</h2>
          <p className="text-muted-foreground mb-4">
            Please select a workflow or entity to visualize
          </p>
          <Button onClick={() => navigate('/selection')}>
            Go to Selection
          </Button>
        </div>
      </div>
    );
  }

  if (!workflowData) {
    return (
      <div className="h-screen flex items-center justify-center bg-workflow-bg">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {type === 'workflow' ? 'Workflow' : 'Entity'} Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The {type} "{id}" could not be loaded
          </p>
          <Button onClick={() => navigate('/selection')}>
            Back to Selection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-workflow-bg">
      {/* Enhanced Header with Navigation */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/selection')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Selection
              </Button>
              <div>
                <h1 className="text-lg font-semibold">
                  {workflowData.workflow.title}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {type === 'workflow' ? 'Workflow' : 'Entity'} Visualization
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate('/selection')}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Change Selection
            </Button>
          </div>
        </div>
      </header>

      {/* Workflow Visualization */}
      <div className="flex-1">
        <WorkflowBuilder 
          selectedWorkflowId={id || undefined}
          workflowData={workflowData || undefined}
          onWorkflowSelect={handleWorkflowSelect}
        />
      </div>
    </div>
  );
}

// ============================================================================
// LANDING PAGE COMPONENT - Move to: src/pages/Index.tsx (or keep in main pages folder)
// ============================================================================

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-workflow-bg">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Pipeline Management Framework
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Visualize and manage your workflows and entities with our intuitive single-view system
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/selection')}
              className="gap-2"
            >
              <Eye className="h-5 w-5" />
              Start Visualization
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/selection')}
              className="gap-2"
            >
              <Settings className="h-5 w-5" />
              Configure & Select
            </Button>
          </div>

          <div className="mt-12 text-sm text-muted-foreground">
            <p>
              Choose from available workflows and entities • Customize your view • 
              Visualize with interactive React Flow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EXPORTS - Move to: src/components/SingleView/index.tsx
// ============================================================================

// Functions and components are already exported inline above
// No need for duplicate exports here

// ============================================================================
// SPLITTING GUIDE
// ============================================================================
/*
TO SPLIT THIS FILE INTO SEPARATE FILES:

1. TYPES:
   - Copy the "TYPES SECTION" to: src/components/SingleView/types.ts

2. CONTEXT:
   - Copy the "CONTEXT SECTION" to: src/components/SingleView/context/SelectionContext.tsx

3. HOOKS:
   - Copy the "HOOKS SECTION" to: src/components/SingleView/hooks/useWorkflowData.ts

4. API SERVICE:
   - Copy the "API SERVICE SECTION" to: src/components/SingleView/services/WorkflowAPI.ts

5. COMPONENTS:
   - Copy "WORKFLOW SELECTOR COMPONENT" to: src/components/SingleView/components/WorkflowSelector.tsx
   - Copy "ENTITY SELECTOR COMPONENT" to: src/components/SingleView/components/EntitySelector.tsx
   - Copy "CUSTOMIZATION PANEL COMPONENT" to: src/components/SingleView/components/CustomizationPanel.tsx

6. PAGES:
   - Copy "SELECTION PAGE COMPONENT" to: src/components/SingleView/SelectionPage.tsx
   - Copy "VISUALIZATION PAGE COMPONENT" to: src/components/SingleView/VisualizationPage.tsx
   - Copy "LANDING PAGE COMPONENT" to: src/pages/Index.tsx (or keep in main pages folder)

7. INDEX FILE:
   - Copy "MAIN EXPORTS" to: src/components/SingleView/index.tsx
   - Add proper imports for all the split files

8. UPDATE IMPORTS:
   - Update App.tsx to import from the new index file
   - Update any other files that import from this single file

REMEMBER TO:
- Add proper imports to each split file
- Export components/functions from each file
- Update the index.tsx to re-export everything
- Test that everything still works after splitting
*/
