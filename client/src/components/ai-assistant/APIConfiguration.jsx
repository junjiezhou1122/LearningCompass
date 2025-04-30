import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Bot, KeyRound, Save, Globe, Thermometer, Sigma } from 'lucide-react';

const APIConfiguration = ({ initialSettings, onSave }) => {
  const [settings, setSettings] = useState(initialSettings || {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000
  });
  
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProviderChange = (value) => {
    let newSettings = {
      ...settings,
      provider: value,
    };
    
    // Set default models based on provider
    if (value === 'openai') {
      newSettings.model = 'gpt-4o';
      newSettings.baseUrl = '';
    } else if (value === 'anthropic') {
      newSettings.model = 'claude-3-7-sonnet-20250219';
      newSettings.baseUrl = '';
    } else if (value === 'custom') {
      newSettings.model = '';
      newSettings.baseUrl = '';
    } else if (value === 'openrouter') {
      newSettings.model = 'google/gemini-2.5-pro-exp-03-25';
      newSettings.baseUrl = 'https://openrouter.ai/api/v1';
    }
    
    setSettings(newSettings);
  };

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <Card className="border-orange-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center">
          <KeyRound className="h-5 w-5 mr-2 text-orange-600" />
          <CardTitle className="text-xl text-orange-700">AI Provider Settings</CardTitle>
        </div>
        <CardDescription>
          Configure your AI provider credentials and preferences
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="basic" className="flex items-center justify-center">
              <Bot className="mr-2 h-4 w-4" /> Basic Settings
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center justify-center">
              <Sigma className="mr-2 h-4 w-4" /> Advanced Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider" className="flex items-center">
                  Provider
                  <span className="ml-1 text-orange-600 text-xs bg-orange-50 px-1.5 py-0.5 rounded-full">Required</span>
                </Label>
                <Select 
                  value={settings.provider} 
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Select which AI provider you want to use
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center">
                  API Key
                  <span className="ml-1 text-orange-600 text-xs bg-orange-50 px-1.5 py-0.5 rounded-full">Required</span>
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder={`Your ${settings.provider} API key`}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.provider === 'openai' ? 'Get your API key from OpenAI dashboard' : 
                   settings.provider === 'anthropic' ? 'Get your API key from Anthropic console' :
                   settings.provider === 'openrouter' ? 'Get your API key from OpenRouter dashboard' :
                   'Enter the API key for your custom service'}
                </p>
              </div>
              
              {settings.provider === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="flex items-center">
                    Base URL
                    <span className="ml-1 text-orange-600 text-xs bg-orange-50 px-1.5 py-0.5 rounded-full">Required</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <Input
                      id="baseUrl"
                      value={settings.baseUrl}
                      onChange={(e) => handleChange('baseUrl', e.target.value)}
                      placeholder="https://api.yourdomain.com"
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The base URL for your custom API endpoint
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="model" className="flex items-center">
                  Model
                  {settings.provider !== 'custom' && (
                    <span className="ml-1 text-orange-600 text-xs bg-orange-50 px-1.5 py-0.5 rounded-full">Required</span>
                  )}
                </Label>
                {settings.provider === 'openai' ? (
                  <Select 
                    value={settings.model} 
                    onValueChange={(value) => handleChange('model', value)}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                ) : settings.provider === 'anthropic' ? (
                  <Select 
                    value={settings.model} 
                    onValueChange={(value) => handleChange('model', value)}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Latest)</SelectItem>
                      <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                    </SelectContent>
                  </Select>
                ) : settings.provider === 'openrouter' ? (
                  <Select 
                    value={settings.model} 
                    onValueChange={(value) => handleChange('model', value)}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google/gemini-2.5-pro-exp-03-25">Google Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="mistralai/mistral-8x7b">Mistral Large</SelectItem>
                      <SelectItem value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="openai/gpt-4o">OpenAI GPT-4o</SelectItem>
                      <SelectItem value="meta-llama/llama-3-70b-instruct">Meta Llama 3 70B</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="model"
                    value={settings.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="Enter model identifier"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {settings.provider === 'openai' ? 'The OpenAI model to use' : 
                   settings.provider === 'anthropic' ? 'The Claude model to use' :
                   settings.provider === 'openrouter' ? 'The model to access via OpenRouter' : 
                   'The model identifier for your custom API (optional)'}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature" className="flex items-center">
                    Temperature <Thermometer className="ml-1 h-3 w-3 text-gray-500" />
                  </Label>
                  <span className="text-sm font-medium">{settings.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  id="temperature"
                  value={[settings.temperature]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => handleChange('temperature', value[0])}
                  className="my-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controls randomness: lower values are more deterministic, higher values more creative (0-1)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxTokens" className="flex items-center">
                    Max Tokens <Sigma className="ml-1 h-3 w-3 text-gray-500" />
                  </Label>
                  <span className="text-sm font-medium">{settings.maxTokens}</span>
                </div>
                <Slider
                  id="maxTokens"
                  value={[settings.maxTokens]}
                  min={100}
                  max={4000}
                  step={100}
                  onValueChange={(value) => handleChange('maxTokens', value[0])}
                  className="my-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of tokens to generate in the response
                </p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-start">
                  <HelpCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Advanced Settings Tips</p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>Lower temperature (0.2-0.5) for more factual, predictable responses</li>
                      <li>Higher temperature (0.7-1.0) for more creative, varied responses</li>
                      <li>Adjust max tokens based on expected response length</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-100 flex justify-between">
        <Button variant="outline" onClick={() => setActiveTab(activeTab === 'basic' ? 'advanced' : 'basic')}>
          {activeTab === 'basic' ? 
            <><Sigma className="mr-2 h-4 w-4" /> Advanced Settings</> : 
            <><Bot className="mr-2 h-4 w-4" /> Basic Settings</>
          }
        </Button>
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
          disabled={!settings.apiKey || (settings.provider === 'custom' && !settings.baseUrl)}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default APIConfiguration;