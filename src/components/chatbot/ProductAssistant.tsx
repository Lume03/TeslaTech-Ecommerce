
"use client";

import { askProductAssistant, type ChatMessage as BackendChatMessage } from '@/ai/flows/product-assistant-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, Loader2, Bot, User, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { getProductByIdFromDB, Product } from '@/lib/data';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isLoading?: boolean;
}

export default function ProductAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial-bot-message', sender: 'bot', text: "¡Hola! Soy el asistente de productos de TeslaTech. ¿Cómo puedo ayudarte a encontrar el equipo tecnológico perfecto hoy?" }
  ]);
  const [isBotLoading, setIsBotLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { addMultipleToCart } = useAppContext();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: inputValue.trim(),
    };

    const historyForBackend: BackendChatMessage[] = messages
      .filter(msg => !msg.isLoading)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.text
      }));

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsBotLoading(true);

    const loadingBotMessageId = Date.now().toString() + '-bot-loading';
    const loadingBotMessage: ChatMessage = {
      id: loadingBotMessageId,
      sender: 'bot',
      text: 'Pensando...',
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingBotMessage]);

    try {
      const botResponse = await askProductAssistant({
        query: userMessage.text,
        history: historyForBackend,
      });

      if (botResponse.actions && botResponse.actions.length > 0) {
        const cartActions = botResponse.actions.filter(a => a.action === 'addToCart');
        if (cartActions.length > 0) {
            const productsToAdd: { product: Product; quantity: number }[] = [];
            await Promise.all(cartActions.map(async (action) => {
                const productData = await getProductByIdFromDB(action.productId);
                if (productData) {
                    productsToAdd.push({ product: productData, quantity: action.quantity });
                } else {
                    console.error(`Chatbot action failed: Product with ID ${action.productId} not found.`);
                }
            }));
            
            if (productsToAdd.length > 0) {
                addMultipleToCart(productsToAdd);
            }
        }
      }

      const finalBotMessage: ChatMessage = {
        id: loadingBotMessageId,
        sender: 'bot',
        text: botResponse.response,
      };
      setMessages(prev => prev.map(msg => msg.id === loadingBotMessageId ? finalBotMessage : msg));
    } catch (error) {
      console.error('Error fetching bot response:', error);
      const errorBotMessage: ChatMessage = {
        id: loadingBotMessageId,
        sender: 'bot',
        text: 'Lo siento, he encontrado un error. Por favor, inténtalo de nuevo.',
      };
      setMessages(prev => prev.map(msg => msg.id === loadingBotMessageId ? errorBotMessage : msg));
    } finally {
      setIsBotLoading(false);
    }
  };


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Open Chatbot"
        >
          <MessageSquare size={28} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-[400px] md:w-[450px] h-[600px] p-0 rounded-lg shadow-xl bg-card flex flex-col border-border"
        sideOffset={10}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-headline font-semibold text-card-foreground">Asistente TeslaTech</h3>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
             <X size={20} />
          </Button>
        </div>

        <ScrollArea className="flex-grow p-4 space-y-6" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end space-x-2 max-w-[80%]", // Adjusted max-w for more side breathing room
                message.sender === 'user' ? "ml-auto justify-end" : "mr-auto justify-start"
              )}
            >
              {message.sender === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Bot size={20} />
                </div>
              )}
              <div
                className={cn(
                  "p-3 rounded-xl shadow",
                  message.sender === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none",
                  message.isLoading && "flex items-center space-x-2"
                )}
              >
                {message.isLoading && message.sender === 'bot' && <Loader2 size={16} className="animate-spin" />}
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
               {message.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <Input
              type="text"
              placeholder="Pregunta sobre productos..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow h-10 bg-input focus-visible:ring-primary"
              disabled={isBotLoading}
            />
            <Button type="submit" size="icon" className="h-10 w-10 bg-primary hover:bg-primary/90" disabled={isBotLoading}>
              {isBotLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
