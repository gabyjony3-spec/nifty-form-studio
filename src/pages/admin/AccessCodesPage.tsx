import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AccessCode {
  id: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export default function AccessCodesPage() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from("admin_access_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar códigos", variant: "destructive" });
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  };

  const createCode = async () => {
    if (!newCode.trim()) {
      toast({ title: "Digite um código", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await supabase
      .from("admin_access_codes")
      .insert({ code: newCode.trim().toUpperCase(), is_active: true });

    if (error) {
      toast({ 
        title: "Erro ao criar código", 
        description: error.message,
        variant: "destructive" 
      });
    } else {
      toast({ title: "Código criado com sucesso!" });
      setNewCode("");
      setDialogOpen(false);
      fetchCodes();
    }
    setCreating(false);
  };

  const toggleCode = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("admin_access_codes")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar código", variant: "destructive" });
    } else {
      toast({ title: currentStatus ? "Código desativado" : "Código ativado" });
      fetchCodes();
    }
  };

  const deleteCode = async (id: string) => {
    const { error } = await supabase
      .from("admin_access_codes")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao deletar código", variant: "destructive" });
    } else {
      toast({ title: "Código deletado" });
      fetchCodes();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-red-100">Códigos de Acesso</h1>
            <p className="text-red-300/70">Gerencie códigos para cadastro de admins</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900">
              <Plus className="h-4 w-4 mr-2" />
              Novo Código
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-red-800/30">
            <DialogHeader>
              <DialogTitle className="text-red-100">Criar Novo Código</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Ex: ADMIN2024"
                className="bg-red-950/30 border-red-800/50 text-red-100"
              />
              <Button 
                onClick={createCode} 
                disabled={creating}
                className="w-full bg-gradient-to-r from-red-600 to-red-800"
              >
                {creating ? "Criando..." : "Criar Código"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-to-br from-red-950/30 to-gray-900/50 border-red-800/30">
        <CardHeader>
          <CardTitle className="text-red-200">Lista de Códigos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-red-300/70">Carregando...</p>
          ) : codes.length === 0 ? (
            <p className="text-red-300/70">Nenhum código cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-red-800/30">
                  <TableHead className="text-red-300">Código</TableHead>
                  <TableHead className="text-red-300">Status</TableHead>
                  <TableHead className="text-red-300">Criado em</TableHead>
                  <TableHead className="text-red-300 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id} className="border-red-800/20">
                    <TableCell className="font-mono text-red-100">{code.code}</TableCell>
                    <TableCell>
                      <Badge variant={code.is_active ? "default" : "secondary"} 
                        className={code.is_active 
                          ? "bg-green-600/20 text-green-400 border-green-600/30" 
                          : "bg-gray-600/20 text-gray-400 border-gray-600/30"
                        }>
                        {code.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-red-300/70">
                      {new Date(code.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleCode(code.id, code.is_active)}
                        className="hover:bg-red-900/30"
                      >
                        {code.is_active ? (
                          <ToggleRight className="h-5 w-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCode(code.id)}
                        className="hover:bg-red-900/30"
                      >
                        <Trash2 className="h-5 w-5 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
