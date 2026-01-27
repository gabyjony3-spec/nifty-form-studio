import { MessageCircle, Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

interface MobilePreviewProps {
  message: string;
  type: "whatsapp" | "instagram_dm" | "email";
  automationName?: string;
}

export function MobilePreview({ message, type, automationName }: MobilePreviewProps) {
  const getStatusBarColor = () => {
    switch (type) {
      case "whatsapp":
        return "bg-[#075E54]";
      case "instagram_dm":
        return "bg-gradient-to-r from-purple-600 to-pink-500";
      case "email":
        return "bg-blue-600";
      default:
        return "bg-muted";
    }
  };

  const getAppName = () => {
    switch (type) {
      case "whatsapp":
        return "WhatsApp";
      case "instagram_dm":
        return "Instagram";
      case "email":
        return "Email";
      default:
        return "Mensagem";
    }
  };

  const getMessageBubbleColor = () => {
    switch (type) {
      case "whatsapp":
        return "bg-[#DCF8C6]";
      case "instagram_dm":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "email":
        return "bg-blue-500";
      default:
        return "bg-muted";
    }
  };

  const getTextColor = () => {
    return type === "whatsapp" ? "text-gray-900" : "text-white";
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground mb-2">Pré-visualização</span>
      
      {/* Phone Frame */}
      <div className="relative w-48 h-80 bg-gray-900 rounded-[2rem] p-2 shadow-2xl border-4 border-gray-800">
        {/* Screen */}
        <div className="h-full w-full bg-gray-100 rounded-[1.5rem] overflow-hidden flex flex-col">
          {/* Status Bar */}
          <div className={`${getStatusBarColor()} text-white px-3 py-2 flex items-center justify-between text-[10px]`}>
            <span className="font-medium">{getAppName()}</span>
            <span>9:41</span>
          </div>

          {/* Chat Header */}
          <div className={`${getStatusBarColor()} text-white px-3 py-2 flex items-center gap-2 border-b border-black/10`}>
            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="h-3 w-3" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-medium truncate">
                {automationName || "Novo Contacto"}
              </p>
              <p className="text-[8px] opacity-75">online</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-[#e5ddd5] p-2 overflow-hidden relative">
            {/* Background Pattern */}
            <div 
              className="absolute inset-0 opacity-5" 
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
              }}
            />

            {/* Message Bubble */}
            {message ? (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className={`${getMessageBubbleColor()} ${getTextColor()} rounded-lg p-2 max-w-[90%] ml-auto shadow-sm`}>
                  <p className="text-[9px] leading-relaxed break-words">
                    {message.length > 100 ? message.slice(0, 100) + "..." : message}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[8px] ${type === "whatsapp" ? "text-gray-600" : "text-white/70"}`}>
                      09:41
                    </span>
                    <CheckCheck className={`h-2.5 w-2.5 ${type === "whatsapp" ? "text-blue-500" : "text-white/70"}`} />
                  </div>
                </div>
                {/* Triangle */}
                <div 
                  className={`absolute -right-1 top-0 w-3 h-3 ${getMessageBubbleColor()}`}
                  style={{ 
                    clipPath: "polygon(0 0, 100% 0, 0 100%)" 
                  }}
                />
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] text-gray-500 text-center px-4">
                  Digite uma mensagem para ver a pré-visualização
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-gray-200 px-2 py-1.5 flex items-center gap-1">
            <div className="flex-1 bg-white rounded-full px-2 py-1">
              <span className="text-[8px] text-gray-400">Mensagem</span>
            </div>
            <div className={`h-5 w-5 rounded-full ${getStatusBarColor()} flex items-center justify-center`}>
              <MessageCircle className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-b-xl" />
      </div>
    </div>
  );
}