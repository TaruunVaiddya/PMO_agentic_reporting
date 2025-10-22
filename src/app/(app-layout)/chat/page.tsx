"use client";

import React, { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInput } from '@/components/chat/chat-input';
import { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { ArrowRight, TrendingUp, PieChart, BarChart3, Calendar } from 'lucide-react';
import { ChatProviderContext } from '@/contexts/chat-provider';
import SSEChatHandler from '@/services/chat-service';
import generateUniqueId from '@/lib/get_unique_id';

export default function Page() {
  const router = useRouter();
  const chatStore = useContext(ChatProviderContext);

  const handleSubmit = async (message: PromptInputMessage) => {
    console.log('Message submitted:', message);

    if (!chatStore) {
      console.error('Chat store not available');
      return;
    }

    try {
      // Generate a unique session ID
      const sessionId = generateUniqueId();
      
      // Get selected agent from session storage (if any)
      const selectedAgent = sessionStorage.getItem('selected-agent') || null;

      // Create SSE handler with the new config object
      const sseHandler = new SSEChatHandler({
        chatStore,
        input: message.text || '',
        sessionId,
        selected_agent: selectedAgent
      });

      // Start the chat and navigate to session page
      sseHandler.startChat();
      
      // Navigate to the chat session page
      router.push(`/chat/${sessionId}?chat=new`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    console.log('Suggestion clicked:', suggestion);

    if (!chatStore) {
      console.error('Chat store not available');
      return;
    }

    try {
      // Generate a unique session ID
      const sessionId = generateUniqueId();
      
      // Get selected agent from session storage (if any)
      const selectedAgent = sessionStorage.getItem('selected-agent') || null;

      // Create SSE handler with the new config object
      const sseHandler = new SSEChatHandler({
        chatStore,
        input: suggestion,
        sessionId,
        selected_agent: selectedAgent
      });

      // Start the chat and navigate to session page
      await sseHandler.startChat();
      
      // Navigate to the chat session page
      router.push(`/chat/${sessionId}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      // You might want to show an error message to the user here
    }
  };

  
  useEffect(() => {
    if(chatStore) {
      chatStore.setChat({});
    }
    if(!localStorage.getItem('user')) {
      router.push('/login');
    }
  }, []);

  return (
    <div className="flex w-full flex-col items-center h-full overflow-y-auto custom-scrollbar pt-[8%]">
      <div className="w-full max-w-3xl px-4">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-light text-white/90 tracking-tight">
            <span className="bg-gradient-to-r from-white/90 via-white to-white/90 bg-clip-text text-transparent font-medium">
              Your Intelligent Data Assistant
            </span>
          </h1>
          <p className="mt-3 text-white/60 text-base">
            Upload your Excel or PDF files and start asking questions
          </p>
        </div>

        <div className="relative">
          <ChatInput
            onSubmit={handleSubmit}
            placeholder="What would you like to know?"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: "Generate Report",
              description: "Create professional reports from your data",
              icon: "📋",
              color: "from-blue-500/20 to-blue-600/10",
              suggestion: "Generate a sales performance report from my Excel data"
            },
            {
              title: "Analyze Excel Data",
              description: "Extract insights from spreadsheets",
              icon: "📊",
              color: "from-green-500/20 to-green-600/10",
              suggestion: "What are the key trends in my financial data?"
            },
            {
              title: "Summarize PDFs",
              description: "Get insights from document content",
              icon: "📄",
              color: "from-purple-500/20 to-purple-600/10",
              suggestion: "Summarize the main findings from this research document"
            }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(item.suggestion)}
              className="group relative p-4 text-left bg-black/10 hover:bg-black/20 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 overflow-hidden"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

              <div className="flex items-start gap-3 relative z-10">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/90 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/50 line-clamp-1">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 duration-200" />
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* Report Templates Section - Full Width */}
      <div className="w-full mt-16 px-6">
        <div className="text-left mb-6">
          <h2 className="text-xl font-medium text-white/90 mb-2">
            Popular Report Templates
          </h2>
          <p className="text-white/50 text-sm">
            Get started with pre-built templates for common business reports
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                name: "Sales Dashboard",
                description: "Revenue trends and performance metrics",
                icon: TrendingUp,
                color: "from-blue-500/20 to-blue-600/10",
                thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
                suggestion: "Create a sales dashboard showing revenue trends, top products, and monthly performance"
              },
              {
                name: "Financial Report",
                description: "P&L statements and financial analysis",
                icon: PieChart,
                color: "from-green-500/20 to-green-600/10",
                thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
                suggestion: "Generate a financial report with profit & loss analysis and expense breakdowns"
              },
              {
                name: "Performance Analytics",
                description: "KPI tracking and metrics analysis",
                icon: BarChart3,
                color: "from-purple-500/20 to-purple-600/10",
                thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
                suggestion: "Create a performance analytics report with KPIs and trend analysis"
              },
              {
                name: "Monthly Summary",
                description: "Monthly business overview report",
                icon: Calendar,
                color: "from-orange-500/20 to-orange-600/10",
                thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
                suggestion: "Generate a monthly summary report with key metrics and highlights"
              }
            ].map((template, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(template.suggestion)}
                className="group relative border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 overflow-hidden bg-transparent"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

                {/* Card structure */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Image thumbnail - Absolute positioning to eliminate gaps */}
                  <div className="relative w-full h-32 overflow-hidden rounded-t-xl bg-black/10">
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 p-4 bg-black/10 group-hover:bg-black/20 transition-colors duration-200">
                    {/* Template name */}
                    <h3 className="text-sm font-medium text-white/90 mb-1 line-clamp-1">
                      {template.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-white/50 line-clamp-2 leading-tight">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Hover arrow */}
                <ArrowRight className="absolute top-3 right-3 w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-0.5 z-20" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
