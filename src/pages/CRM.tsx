import React, { useState } from 'react';
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Filter, 
  MessageCircle, 
  Calendar, 
  DollarSign, 
  Phone
} from 'lucide-react';

// Tipos locais para o Kanban
interface Task {
  id: string;
  title: string;
  company: string;
  value: string;
  date: string;
  tags: string[];
  avatar?: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  count: number;
  tasks: Task[];
}

const initialColumns: Column[] = [
  {
    id: 'new',
    title: 'Novos Contatos',
    color: 'bg-blue-500',
    count: 3,
    tasks: [
      { id: '1', title: 'Carlos Almeida', company: 'Tech Solutions', value: 'R$ 1.200', date: 'Hoje', tags: ['Quente'], avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
      { id: '2', title: 'Fernanda Costa', company: 'Varejo Bom', value: 'R$ 850', date: 'Hoje', tags: ['WhatsApp'], avatar: 'https://i.pravatar.cc/150?u=a048581f4e29026701d' },
      { id: '3', title: 'Ricardo Mendes', company: 'Consultoria RM', value: 'R$ 2.500', date: 'Ontem', tags: ['Indicação'] },
    ]
  },
  {
    id: 'progress',
    title: 'Em Negociação',
    color: 'bg-amber-500',
    count: 2,
    tasks: [
      { id: '4', title: 'Juliana Paes', company: 'Marketing Digital', value: 'R$ 4.000', date: '2 dias atrás', tags: ['WhatsApp', 'Urgente'], avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
      { id: '5', title: 'Roberto Justos', company: 'Enterprise Ltda', value: 'R$ 15.000', date: '3 dias atrás', tags: ['Corporativo'] },
    ]
  },
  {
    id: 'waiting',
    title: 'Aguardando Resposta',
    color: 'bg-purple-500',
    count: 2,
    tasks: [
      { id: '6', title: 'Ana Maria', company: 'Doces & Cia', value: 'R$ 300', date: '5 dias atrás', tags: ['Morno'], avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d' },
      { id: '7', title: 'Pedro Santos', company: 'Auto Peças', value: 'R$ 1.800', date: '1 semana atrás', tags: ['Follow-up'] },
    ]
  },
  {
    id: 'closed',
    title: 'Fechado / Ganho',
    color: 'bg-green-500',
    count: 1,
    tasks: [
      { id: '8', title: 'Marcelo Vieira', company: 'Advocacia MV', value: 'R$ 5.000', date: 'Ontem', tags: ['Contrato Assinado'], avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
    ]
  }
];

export const CRM: React.FC = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [sourceColumnId, setSourceColumnId] = useState<string | null>(null);

  // Inicia o arraste
  const handleDragStart = (e: React.DragEvent, taskId: string, columnId: string) => {
    setDraggedTaskId(taskId);
    setSourceColumnId(columnId);
    // Efeito visual no cursor
    e.dataTransfer.effectAllowed = 'move';
    // Pequeno hack para esconder a opacidade apenas no elemento sendo movido na DOM, mas manter a imagem fantasma
    const target = e.target as HTMLDivElement;
    setTimeout(() => {
        target.classList.add('opacity-50', 'scale-95');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLDivElement;
    target.classList.remove('opacity-50', 'scale-95');
    setDraggedTaskId(null);
    setSourceColumnId(null);
  }

  // Permite soltar o item (necessário prevenir o comportamento padrão)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Lógica ao soltar
  const handleDrop = (e: React.DragEvent, destColumnId: string) => {
    e.preventDefault();

    if (!draggedTaskId || !sourceColumnId) return;
    if (sourceColumnId === destColumnId) return; // Se soltou na mesma coluna, não faz nada (por enquanto sem reordenação interna)

    // Clona as colunas para imutabilidade
    const newColumns = [...columns];

    // Encontra índices
    const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumnId);
    const destColIndex = newColumns.findIndex(col => col.id === destColumnId);

    // Encontra a tarefa
    const taskToMove = newColumns[sourceColIndex].tasks.find(t => t.id === draggedTaskId);
    
    if (taskToMove) {
      // Remove da origem
      newColumns[sourceColIndex].tasks = newColumns[sourceColIndex].tasks.filter(t => t.id !== draggedTaskId);
      newColumns[sourceColIndex].count = newColumns[sourceColIndex].tasks.length;

      // Adiciona no destino
      newColumns[destColIndex].tasks.push(taskToMove);
      newColumns[destColIndex].count = newColumns[destColIndex].tasks.length;

      setColumns(newColumns);
    }

    setDraggedTaskId(null);
    setSourceColumnId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-zinc-900">Pipeline WhatsApp</h1>
          <div className="h-6 w-px bg-zinc-200"></div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-500">
                U{i}
              </div>
            ))}
            <button className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-colors">
              <Plus size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar oportunidade..." 
              className="pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
            <Filter size={16} />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm">
            <Plus size={16} />
            Nova Oportunidade
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="w-[320px] flex flex-col h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                  <h3 className="font-semibold text-zinc-700">{column.title}</h3>
                  <span className="bg-zinc-100 text-zinc-500 text-xs font-medium px-2 py-0.5 rounded-full border border-zinc-200">
                    {column.count}
                  </span>
                </div>
                <button className="text-zinc-400 hover:text-zinc-600">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Column Content (Drop Zone) */}
              <div 
                className={`flex-1 bg-zinc-100/50 rounded-xl border p-2 overflow-y-auto space-y-3 transition-colors ${
                    draggedTaskId && sourceColumnId !== column.id ? 'border-brand-300 bg-brand-50/30' : 'border-zinc-200/50'
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {column.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-grab active:cursor-grabbing group select-none"
                  >
                    <div className="flex justify-between items-start mb-2 pointer-events-none">
                       <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              tag === 'WhatsApp' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : tag === 'Urgente'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-zinc-50 text-zinc-500 border-zinc-100'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button className="text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    
                    <h4 className="font-semibold text-zinc-900 text-sm leading-tight pointer-events-none">{task.title}</h4>
                    <p className="text-xs text-zinc-500 mb-3 pointer-events-none">{task.company}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-50 mt-3 pointer-events-none">
                       <div className="flex items-center gap-2">
                          {task.avatar ? (
                             <img src={task.avatar} alt="" className="w-6 h-6 rounded-full border border-zinc-100" />
                          ) : (
                             <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-bold">
                                {task.title.substring(0, 2).toUpperCase()}
                             </div>
                          )}
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">
                             <MessageCircle size={12} />
                             <span className="text-[10px] font-medium">Chat</span>
                          </div>
                       </div>
                       <div className="text-xs font-semibold text-zinc-700">
                          {task.value}
                       </div>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400 pointer-events-none">
                       <span className="flex items-center gap-1">
                          <Calendar size={12} /> {task.date}
                       </span>
                    </div>
                  </div>
                ))}
                
                <button className="w-full py-2 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-700 hover:bg-white rounded-lg border border-transparent hover:border-zinc-200 transition-all text-sm font-medium border-dashed">
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
            </div>
          ))}
          
          {/* Add Column Button */}
          <div className="w-[320px] shrink-0">
             <button className="w-full h-12 flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-600 border-2 border-dashed border-zinc-200 hover:border-zinc-300 rounded-xl transition-colors">
                <Plus size={20} />
                Adicionar Etapa
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};