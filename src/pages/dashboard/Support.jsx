import React, { useState } from 'react';
import { HelpCircle, Mail, MessageCircle, FileText, ExternalLink, Play, ChevronDown, Send, Bot, User, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_ITEMS = [
  {
    question: "Como os clientes ganham Moedas Z?",
    answer: "Os clientes ganham pontos escaneando o QR Code do seu 'Display de Balcão' ou quando você registra a compra no 'Terminal PDV'. O cálculo é baseado na sua taxa de cashback configurada."
  },
  {
    question: "Como o cliente resgata um prêmio?",
    answer: "Quando o cliente atinge a pontuação necessária, você acessa a aba 'Clientes', localiza o perfil dele e clica em 'Dar Baixa (Resgate)'. Selecione o prêmio e o sistema debitará os pontos automaticamente."
  },
  {
    question: "O que acontece se a assinatura vencer?",
    answer: "O acesso às funções de pontuação e resgate será bloqueado. Seus dados permanecerão salvos por 60 dias. Basta regularizar o pagamento no menu 'Faturamento' para liberar instantaneamente."
  },
  {
    question: "Posso alterar minha taxa de cashback?",
    answer: "Sim, no menu 'Configurações'. Recomendamos taxas entre 10% e 15% para manter os clientes engajados sem comprometer sua margem de lucro."
  }
];

export default function Support() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Olá! Eu sou o Z-Bot, seu assistente virtual. Como posso te ajudar com o Z-Card hoje?' }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulação de IA Avançada
    setTimeout(() => {
      let botResponse = "Interessante sua dúvida! Como especialista Z-Card, recomendo que você verifique o menu lateral. Mas para te ajudar agora: você está tentando configurar algo ou operar o sistema?";
      
      const input = inputValue.toLowerCase();
      
      if (input.includes('cadastro') || input.includes('cadastrar')) {
        botResponse = "Para cadastrar sua loja, basta preencher o formulário inicial. Se você fala de cadastrar uma recompensa, vá em 'Recompensas' > 'Novo Prêmio'. Para cadastrar um cliente, ele mesmo faz isso ao escanear seu QR Code pela primeira vez!";
      } else if (input.includes('login') || input.includes('entrar')) {
        botResponse = "O login é feito com seu e-mail e senha cadastrados. Se estiver com dificuldades, verifique se está na 'Área do Parceiro'.";
      } else if (input.includes('senha') || input.includes('recuperar')) {
        botResponse = "Esqueceu a senha? Na tela de login, clique em 'Esqueceu?'. Enviaremos um link de redefinição para o seu e-mail. Lembre-se: a nova senha deve ter 8 caracteres, uma maiúscula e um número.";
      } else if (input.includes('qr') || input.includes('codigo') || input.includes('código')) {
        botResponse = "Para gerar seu QR Code de balcão, clique em 'Exibir QR Code' no seu Dashboard ou vá em 'Terminal PDV'. Deixe esse código visível para seus clientes escanearem.";
      } else if (input.includes('pdv') || input.includes('moeda') || input.includes('ponto') || input.includes('ganhar')) {
        botResponse = "No 'Terminal PDV', você digita o valor da compra do cliente e ele escaneia o QR Code gerado na hora para ganhar as moedas automaticamente, conforme seu cashback.";
      } else if (input.includes('baixa') || input.includes('resgate') || input.includes('entregar')) {
        botResponse = "Para dar baixa em um prêmio, vá na aba 'Clientes', localize o cliente e clique em 'Dar Baixa'. Selecione o prêmio que ele está resgatando e pronto!";
      } else if (input.includes('notificação') || input.includes('enviar') || input.includes('mensagem')) {
        botResponse = "Você pode enviar notificações push para seus clientes na aba 'Campanhas'. É a melhor forma de avisar sobre promoções relâmpago!";
      } else if (input.includes('relatório') || input.includes('analise') || input.includes('faturamento')) {
        botResponse = "Seus resultados estão na aba 'Relatórios'. Lá você vê o faturamento gerado pelo app e o comportamento dos seus clientes.";
      }

      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    }, 800);
  };

  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-brand-yellow/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-glow-yellow border border-brand-yellow/20"
        >
          <HelpCircle className="w-10 h-10 text-brand-yellow" />
        </motion.div>
        <h1 className="text-4xl font-black text-white tracking-tight">Central de Sucesso</h1>
        <p className="text-slate-400 max-w-lg mx-auto">Tudo o que você precisa para dominar o Z-Card e fidelizar seus clientes como nunca.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Vídeo e FAQ */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Vídeo Demonstrativo */}
          <section className="bg-brand-surface border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Guia Rápido de Uso</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Vídeo: 5 minutos para começar</p>
              </div>
              <div className="px-3 py-1 bg-brand-yellow/10 text-brand-yellow rounded-full text-[10px] font-black uppercase">Novo</div>
            </div>
            <div className="aspect-video bg-slate-900 flex items-center justify-center relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
              <img src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-30" alt="Tutorial Thumbnail" />
              <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center shadow-glow-yellow group-hover:scale-110 transition-transform z-10">
                <Play className="w-8 h-8 text-brand-bg fill-brand-bg ml-1" />
              </div>
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-bold text-sm z-10">Clique para assistir ao tutorial completo</p>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white ml-2 mb-6">Dúvidas Frequentes</h2>
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className="bg-brand-surface border border-slate-800 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                >
                  <span className="font-bold text-white text-sm">{item.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-slate-400 text-sm leading-relaxed"
                    >
                      {item.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </section>
        </div>

        {/* Lado Direito: Canais de Contato e Z-Bot */}
        <div className="space-y-8">
          
          {/* Canais Rápidos */}
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-lg font-bold text-white mb-2">Suporte & Treinamento</h3>
            
            <div className="p-5 bg-brand-yellow/5 border border-brand-yellow/10 rounded-2xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-brand-yellow/10 rounded-xl flex items-center justify-center text-brand-yellow shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Treinamento via IA</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">Use o chat abaixo para aprender a usar todos os recursos do Z-Card em tempo real.</p>
                </div>
              </div>
            </div>

            <a href="mailto:suporte@audaxa.com.br" className="block p-5 bg-slate-900 border border-slate-800 rounded-2xl group hover:border-slate-600 transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">E-mail Administrativo</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">suporte@audaxa.com.br</p>
                </div>
              </div>
            </a>
          </div>

          {/* Z-Bot: Agente de IA Simulado */}
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] flex flex-col h-[500px] shadow-2xl relative overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center text-brand-bg shadow-glow-yellow">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Z-Bot IA</h3>
                <div className="flex items-center text-[9px] text-green-500 uppercase font-black tracking-widest">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                  Online Agora
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-brand-yellow text-brand-bg font-bold rounded-tr-none' 
                      : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center space-x-2">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pergunte algo ao Z-Bot..."
                className="flex-1 bg-brand-bg border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-brand-yellow outline-none transition-all"
              />
              <button 
                type="submit"
                className="w-10 h-10 bg-brand-yellow text-brand-bg rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow-yellow"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>

      <div className="text-center pt-8 border-t border-slate-800/50">
        <p className="text-slate-600 text-[10px] uppercase tracking-[0.3em]">Audaxa Tecnologia • Z-Card Ecosystem 2026</p>
      </div>
    </div>
  );
}
