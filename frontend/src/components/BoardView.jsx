import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getBoard, updateCard, createCard, createColumn, updateColumn } from '../api';
import CardModal from './CardModal';
import { Plus, MoreHorizontal, ArrowLeft } from 'lucide-react';

const BoardView = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const fetchBoard = async () => {
    try {
      const response = await getBoard(boardId);
      setBoard(response.data);
    } catch (error) {
      console.error('Error fetching board:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find columns
    const sourceColumn = board.columns.find(col => col.id.toString() === source.droppableId);
    const destColumn = board.columns.find(col => col.id.toString() === destination.droppableId);
    
    // Optimistic UI Update (Simplified: just refetch for now to ensure consistency)
    // In production, we would clone state and update immediately.
    
    try {
        await updateCard(draggableId, { columnId: destColumn.id });
        fetchBoard(); 
    } catch (error) {
        console.error("Move failed", error);
    }
  };

  const handleAddCard = async (columnId) => {
      const title = prompt("Título do Cartão:");
      if (!title) return;
      
      try {
          await createCard({
              title,
              columnId,
              menteeName: "Novo Mentorado", // Default
          });
          fetchBoard();
      } catch (e) {
          console.error(e);
      }
  };

  const handleCreateColumn = async () => {
      const title = prompt("Nome da nova coluna:");
      if (!title) return;
      try {
        await createColumn(board.id, { title, order: board.columns.length });
        fetchBoard();
      } catch (e) {
        console.error(e);
      }
  };

  const handleRenameColumn = async (column) => {
      const title = prompt("Novo nome da coluna:", column.title);
      if (!title || title === column.title) return;
      try {
        await updateColumn(column.id, { title });
        fetchBoard();
      } catch (e) {
        console.error(e);
      }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse">Carregando...</div>;
  if (!board) return <div className="p-8 text-center text-zinc-500">Quadro não encontrado</div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-700">
      <div className="mb-8 flex items-start gap-4">
        <button 
          onClick={() => navigate('/boards')} 
          className="mt-1 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition"
          title="Voltar para a lista de quadros"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-4xl font-bold text-white uppercase tracking-tighter drop-shadow-lg">{board.title}</h2>
          {board.description && <p className="text-zinc-400 mt-2 text-sm max-w-2xl">{board.description}</p>}
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {board.columns.map(column => (
            <div key={column.id} className="min-w-[320px] w-[320px] bg-black/40 backdrop-blur-sm rounded-lg p-4 flex flex-col max-h-full border border-zinc-800/50">
              <h3 
                className="font-bold text-zinc-300 mb-4 px-1 flex justify-between items-center uppercase text-xs tracking-widest cursor-pointer hover:text-white transition"
                onClick={() => handleRenameColumn(column)}
                title="Clique para renomear"
              >
                  <span className="truncate">{column.title}</span>
                  <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 ml-2 flex-shrink-0">{column.cards?.length || 0}</span>
              </h3>
              
              <Droppable droppableId={column.id.toString()}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto space-y-3 min-h-[100px] transition-colors rounded-lg p-1 ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                  >
                    {column.cards && column.cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedCard(card)}
                            style={{ ...provided.draggableProps.style }}
                            className={`
                                relative bg-[#181818] p-4 rounded shadow-lg cursor-pointer group transition-all duration-200 border border-transparent
                                hover:scale-105 hover:bg-[#202020] hover:border-zinc-600 hover:z-50
                                ${snapshot.isDragging ? 'ring-2 ring-red-600 rotate-2 z-50 shadow-2xl scale-110' : ''}
                            `}
                          >
                            <h4 className="font-bold text-white text-sm mb-3 group-hover:text-red-500 transition">{card.title}</h4>
                            
                            {card.menteeName && (
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-4 h-4 rounded bg-red-900/50 text-red-400 flex items-center justify-center text-[8px] font-bold border border-red-900">
                                  {card.menteeName.charAt(0)}
                                </div>
                                <span className="text-xs text-zinc-400">{card.menteeName}</span>
                              </div>
                            )}

                            {(card.energyMentee > 0 || card.energyMentor > 0) && (
                                <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2 opacity-60 group-hover:opacity-100 transition">
                                    {card.energyMentee > 0 && (
                                      <div>
                                        <p className="text-[9px] text-zinc-500 mb-1 uppercase tracking-wider">Mentorado</p>
                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.5)]" style={{width: `${card.energyMentee * 10}%`}}></div>
                                        </div>
                                      </div>
                                    )}
                                    {card.energyMentor > 0 && (
                                      <div>
                                        <p className="text-[9px] text-zinc-500 mb-1 uppercase tracking-wider">Mentor</p>
                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500/80 shadow-[0_0_5px_rgba(59,130,246,0.5)]" style={{width: `${card.energyMentor * 10}%`}}></div>
                                        </div>
                                      </div>
                                    )}
                                </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <button 
                onClick={() => handleAddCard(column.id)}
                className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition text-xs uppercase tracking-widest font-bold"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          ))}

          <button
            onClick={handleCreateColumn}
            className="min-w-[320px] h-[60px] border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition font-bold uppercase tracking-wider text-sm"
          >
            <Plus size={20} className="mr-2" /> Nova Coluna
          </button>
        </div>
      </DragDropContext>

      {selectedCard && (
        <CardModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
          onUpdate={(updatedCard) => {
              fetchBoard();
          }}
        />
      )}
    </div>
  );
};

export default BoardView;
