"use client";

import React, { useState } from 'react';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessage, type ChatMessageData, type ToolCallData } from '@/components/chat/chat-message';
import { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from '@/components/ai-elements/conversation';
import {
  WebPreview,
  WebPreviewBody
} from '@/components/ai-elements/web-preview-vercel';
import { WebPreviewControls } from '@/components/ai-elements/web-preview-controls';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';


interface ChatSessionPageProps {
  params: Promise<{
    session_id: string;
  }>;
}

export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { session_id } = React.use(params);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [previewData, setPreviewData] = useState({
    html: '',
    css: '',
    js: '',
    title: '',
    isVisible: false,
    isStreaming: false
  });

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // You can add a toast notification here
  };

  const handleRetry = (messageId: string) => {
    // Implement retry logic here
  };

  const handleLike = (messageId: string) => {
    // Implement like logic here
  };

  const handleDislike = (messageId: string) => {
    // Implement dislike logic here
  };

  const handlePreviewClick = (toolCall: ToolCallData) => {
    // Force close and reopen to ensure clean state
    setPreviewData(prev => ({ ...prev, isVisible: false }));

    // Use setTimeout to ensure state update happens
    setTimeout(() => {
      const newPreviewData = {
        html: toolCall.output?.html || '',
        css: toolCall.output?.css || '',
        js: toolCall.output?.js || '',
        title: toolCall.output?.title || 'Dashboard Preview',
        isVisible: true,
        isStreaming: false
      };
      setPreviewData(newPreviewData);
    }, 50);
  };

  const handleClosePreview = () => {
    setPreviewData(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    // Add user message
    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      content: message.text || '',
      sender: 'user',
      timestamp: new Date(),
      files: message.files
    };

    setMessages(prev => [...prev, userMessage]);

    // TODO: Implement API call to send message and get response
    // For now, simulate a response with reasoning
    const assistantId = (Date.now() + 1).toString();

    // First, add assistant message with reasoning and tasks in streaming state
    const assistantMessage: ChatMessageData = {
      id: assistantId,
      content: '',
      reasoning: 'Let me analyze the user\'s request. They are asking about ' + (message.text || 'data analysis') + '. I should provide a helpful response that addresses their needs specifically. I\'ll consider what type of assistance they might need with their data files.',
      sender: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
      tasks: [
        {
          id: 'task-1',
          title: 'Analyzing request',
          status: 'running',
          description: 'Understanding user requirements'
        },
        {
          id: 'task-2',
          title: 'Preparing response',
          status: 'pending',
          description: 'Generating helpful suggestions'
        },
        {
          id: 'task-3',
          title: 'Check file requirements',
          status: 'pending',
          files: ['data.xlsx', 'report.pdf']
        }
      ],
      toolCalls: [
        {
          id: 'preview-tool',
          name: 'generate_preview',
          state: 'input-streaming',
          input: {
            type: 'dashboard',
            data_source: 'sales_data.xlsx',
            chart_types: ['revenue_trend', 'signups_by_source']
          }
        }
      ]
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Simulate task progression
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? {
              ...msg,
              tasks: msg.tasks?.map(task =>
                task.id === 'task-1' ? { ...task, status: 'completed' as const } :
                task.id === 'task-2' ? { ...task, status: 'running' as const } :
                task
              )
            }
          : msg
      ));
    }, 1000);

    // Define dashboard data outside setTimeout for reuse
    const dashboardHTML = `<div class="dashboard">
  <h1>Sales Dashboard</h1>
  <div class="metrics">
    <div class="metric-card">
      <h3>Total Revenue</h3>
      <span class="value">$125,430</span>
      <span class="change positive">+8.2%</span>
    </div>
    <div class="metric-card">
      <h3>Active Users</h3>
      <span class="value">18,342</span>
      <span class="change positive">+2.1%</span>
    </div>
    <div class="metric-card">
      <h3>Churn Rate</h3>
      <span class="value">3.4%</span>
      <span class="change negative">-0.3%</span>
    </div>
    <div class="metric-card">
      <h3>NPS</h3>
      <span class="value">62</span>
      <span class="change positive">+1</span>
    </div>
  </div>
  <div class="charts">
    <div class="chart-container">
      <h3>Monthly Revenue</h3>
      <canvas id="revenueChart" width="400" height="200"></canvas>
    </div>
    <div class="chart-container">
      <h3>New Signups by Source</h3>
      <canvas id="signupsChart" width="400" height="200"></canvas>
    </div>
  </div>
</div>`;

    const dashboardCSS = `body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.dashboard h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5rem;
  font-weight: 700;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.metric-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  text-align: left;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.metric-card h3 {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-card .value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.metric-card .change {
  font-size: 0.875rem;
  font-weight: 500;
}

.metric-card .change.positive {
  color: #059669;
}

.metric-card .change.negative {
  color: #dc2626;
}

.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
}

.chart-container {
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.chart-container h3 {
  margin: 0 0 20px 0;
  font-size: 1.125rem;
  color: #374151;
  font-weight: 600;
}

canvas {
  max-width: 100%;
  height: auto;
}`;

    const dashboardJS = `// Revenue Chart
const revenueCanvas = document.getElementById('revenueChart');
const revenueCtx = revenueCanvas.getContext('2d');

const revenueData = [40000, 45000, 52000, 48000, 58000, 62000, 65000, 68000, 72000, 75000, 78000, 82000];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function drawRevenueChart() {
  const padding = 40;
  const chartWidth = revenueCanvas.width - padding * 2;
  const chartHeight = revenueCanvas.height - padding * 2;
  const maxValue = Math.max(...revenueData);
  const minValue = Math.min(...revenueData);
  const valueRange = maxValue - minValue;

  revenueCtx.clearRect(0, 0, revenueCanvas.width, revenueCanvas.height);

  // Draw line chart
  revenueCtx.strokeStyle = '#3b82f6';
  revenueCtx.lineWidth = 3;
  revenueCtx.beginPath();

  revenueData.forEach((value, index) => {
    const x = padding + (index * (chartWidth / (revenueData.length - 1)));
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    if (index === 0) {
      revenueCtx.moveTo(x, y);
    } else {
      revenueCtx.lineTo(x, y);
    }

    // Draw points
    revenueCtx.save();
    revenueCtx.fillStyle = '#3b82f6';
    revenueCtx.beginPath();
    revenueCtx.arc(x, y, 4, 0, Math.PI * 2);
    revenueCtx.fill();
    revenueCtx.restore();

    // Draw month labels
    revenueCtx.fillStyle = '#6b7280';
    revenueCtx.font = '12px Arial';
    revenueCtx.textAlign = 'center';
    revenueCtx.fillText(months[index], x, revenueCanvas.height - 10);
  });

  revenueCtx.stroke();
}

// Signups Chart
const signupsCanvas = document.getElementById('signupsChart');
const signupsCtx = signupsCanvas.getContext('2d');

const signupsData = [
  { label: 'Organic', value: 850, color: '#10b981' },
  { label: 'Paid', value: 650, color: '#3b82f6' },
  { label: 'Referral', value: 420, color: '#8b5cf6' },
  { label: 'Social', value: 520, color: '#f59e0b' },
  { label: 'Direct', value: 680, color: '#ef4444' }
];

function drawSignupsChart() {
  const padding = 40;
  const chartWidth = signupsCanvas.width - padding * 2;
  const chartHeight = signupsCanvas.height - padding * 2;
  const maxValue = Math.max(...signupsData.map(d => d.value));
  const barWidth = chartWidth / signupsData.length * 0.8;
  const barSpacing = chartWidth / signupsData.length * 0.2;

  signupsCtx.clearRect(0, 0, signupsCanvas.width, signupsCanvas.height);

  signupsData.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight;
    const x = padding + (index * (chartWidth / signupsData.length)) + barSpacing / 2;
    const y = padding + chartHeight - barHeight;

    // Draw bar
    signupsCtx.fillStyle = item.color;
    signupsCtx.fillRect(x, y, barWidth, barHeight);

    // Draw value on top
    signupsCtx.fillStyle = '#374151';
    signupsCtx.font = '12px Arial';
    signupsCtx.textAlign = 'center';
    signupsCtx.fillText(item.value, x + barWidth/2, y - 5);

    // Draw label
    signupsCtx.fillText(item.label, x + barWidth/2, signupsCanvas.height - 10);
  });
}

drawRevenueChart();
drawSignupsChart();`;

    // Complete all tasks and show preview
    setTimeout(() => {

      // Show preview
      setPreviewData({
        html: dashboardHTML,
        css: dashboardCSS,
        js: dashboardJS,
        title: 'Sales Dashboard',
        isVisible: true,
        isStreaming: false
      });

      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? {
              ...msg,
              content: "I understand you want to " + (message.text || 'help with your data') + ". I've created a sample dashboard for you to demonstrate our capabilities. Check the preview on the right!",
              isStreaming: false,
              reasoningDuration: 2,
              tasks: msg.tasks?.map(task => ({ ...task, status: 'completed' as const }))
            }
          : msg
      ));
    }, 2000);

    // Update tool call to show streaming state
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId && msg.toolCalls
          ? {
              ...msg,
              toolCalls: msg.toolCalls.map(tool =>
                tool.id === 'preview-tool'
                  ? { ...tool, state: 'input-available' as const }
                  : tool
              )
            }
          : msg
      ));
    }, 1000);

    // Complete the tool call with output data
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId && msg.toolCalls
          ? {
              ...msg,
              toolCalls: msg.toolCalls.map(tool =>
                tool.id === 'preview-tool'
                  ? {
                      ...tool,
                      state: 'output-available' as const,
                      output: {
                        html: dashboardHTML,
                        css: dashboardCSS,
                        js: dashboardJS,
                        title: 'Sales Dashboard'
                      }
                    }
                  : tool
              )
            }
          : msg
      ));
    }, 2000);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel - Chat */}
      <div className={cn(
        "flex flex-col transition-all duration-300 ease-in-out",
        previewData.isVisible ? "w-1/2" : "w-full"
      )}>
        {/* Chat Conversation Area */}
        <div className='flex-1 overflow-hidden'>
          <Conversation className="w-full h-full overflow-y-auto custom-scrollbar">
              <ConversationContent className="max-w-2xl mx-auto">
              {messages.length === 0 ? (
                  <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="No messages yet"
                  description="Start a conversation to see messages here. I can help you analyze Excel and PDF files, generate reports, and answer questions about your data."
                  />
              ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onCopy={handleCopy}
                      onRetry={handleRetry}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      onPreviewClick={handlePreviewClick}
                    />
                  ))
              )}
              </ConversationContent>
              <ConversationScrollButton />
          </Conversation>
        </div>

        {/* Chat Input at Bottom - Fixed */}
        <div className="bg-card/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto p-4">
            <ChatInput
              onSubmit={handleSubmit}
              placeholder="Type a message..."
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      {previewData.isVisible && (
        <div className="w-1/2 border-l border-border relative animate-in slide-in-from-right duration-300">
          <WebPreview style={{ height: '100%' }}>
            <WebPreviewControls
              title={previewData.title}
              html={previewData.html}
              css={previewData.css}
              js={previewData.js}
              onClose={handleClosePreview}
            />
            <WebPreviewBody
              html={previewData.html}
              css={previewData.css}
              js={previewData.js}
            />
          </WebPreview>
        </div>
      )}
    </div>
  );
}
