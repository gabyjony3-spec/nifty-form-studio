import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface ActionItem {
  action: string;
  category: string;
  impact: "alto" | "médio" | "baixo";
  difficulty: "fácil" | "médio" | "difícil";
}

interface ActionTableProps {
  actions: ActionItem[];
  delay?: number;
}

const ActionTable = ({ actions, delay = 0 }: ActionTableProps) => {
  const navigate = useNavigate();
  
  const getImpactBadge = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "alto":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/30">Alto</Badge>;
      case "médio":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/30">Médio</Badge>;
      case "baixo":
        return <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted/80">Baixo</Badge>;
      default:
        return <Badge variant="outline">{impact}</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "fácil":
        return <Badge variant="outline" className="border-green-500/50 text-green-600">Fácil</Badge>;
      case "médio":
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">Médio</Badge>;
      case "difícil":
        return <Badge variant="outline" className="border-red-500/50 text-red-600">Difícil</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      seo: "text-blue-500",
      conversão: "text-green-500",
      velocidade: "text-yellow-500",
      copywriting: "text-purple-500",
      estrutura: "text-orange-500",
    };
    return colors[category.toLowerCase()] || "text-foreground";
  };

  const getCategoryTab = (category: string) => {
    const tabs: Record<string, string> = {
      seo: "seo",
      conversão: "conversion",
      velocidade: "performance",
      copywriting: "conversion",
      estrutura: "structure",
    };
    return tabs[category.toLowerCase()] || "seo";
  };

  const handleLearnMore = (category: string) => {
    navigate(`/dashboard/library?tab=${getCategoryTab(category)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <ClipboardList className="h-5 w-5 text-primary" />
            Tabela de Ações Prioritárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Impacto</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="font-semibold">Ação Sugerida</TableHead>
                  <TableHead className="font-semibold">Dificuldade</TableHead>
                  <TableHead className="font-semibold text-center">Ajuda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay + 0.1 * index }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-3">
                      {getImpactBadge(item.impact)}
                    </TableCell>
                    <TableCell className={`py-3 font-medium ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </TableCell>
                    <TableCell className="py-3 text-foreground max-w-md">
                      {item.action}
                    </TableCell>
                    <TableCell className="py-3">
                      {getDifficultyBadge(item.difficulty)}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLearnMore(item.category)}
                        className="text-primary hover:text-primary hover:bg-primary/10 gap-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span className="text-xs">Aprender</span>
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActionTable;
