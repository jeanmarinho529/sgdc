// Dados FICTÍCIOS de demonstração, usados apenas para o painel não iniciar vazio.
// Nomes, e-mails e relatos são inventados e não representam pessoas reais.
import { applyUpdate, buildDemand } from '../lib/demands.js';

const base = [
  { name: 'Ana Souza', email: 'ana.souza@exemplo.com', category: 'Tecnologia e inclusão digital', location: 'Vila Nova', description: 'Moradores idosos pedem oficina básica de uso do celular e de aplicativos de bancos.', days: 12, update: { status: 'atendimento', priority: 'media', note: 'Oficina agendada com o projeto de inclusão digital.' } },
  { name: 'Carlos Pereira', email: 'carlos.p@exemplo.com', category: 'Educação e reforço escolar', location: 'Jardim Aurora', description: 'A associação de moradores solicita reforço de matemática para estudantes do 9º ano.', days: 9, update: { status: 'triagem', priority: 'alta', note: 'Encaminhada ao coordenador do projeto de educação.' } },
  { name: 'Beatriz Lima', email: 'bia.lima@exemplo.com', category: 'Meio ambiente', location: 'Centro', description: 'Proposta de horta comunitária no terreno ao lado da escola, com apoio técnico.', days: 20, update: { status: 'concluida', priority: 'baixa', note: 'Horta implantada em mutirão com estudantes bolsistas.' } },
  { name: 'João Ferreira', email: 'joao.f@exemplo.com', category: 'Saúde e bem-estar', location: 'Bairro Universitário', description: 'Pedido de palestra sobre prevenção de doenças crônicas para o grupo de idosos.', days: 3, update: null },
  { name: 'Marta Oliveira', email: 'marta.o@exemplo.com', category: 'Cultura, esporte e lazer', location: 'Parque das Flores', description: 'Liderança comunitária pede oficinas de dança e teatro para crianças aos sábados.', days: 2, update: null },
  { name: 'Paulo Santos', email: 'paulo.s@exemplo.com', category: 'Infraestrutura comunitária', location: 'Vila Esperança', description: 'Solicitação de parecer técnico sobre alagamento recorrente na rua da quadra esportiva.', days: 6, update: { status: 'triagem', priority: 'alta', note: 'Aguardando visita técnica.' } },
];

export function buildSeed(now = new Date()) {
  const demands = [];
  for (const item of base) {
    const created = new Date(now.getTime() - item.days * 86_400_000);
    let demand = buildDemand({ ...item, phone: '', consent: true }, demands, created);
    if (item.update) {
      const when = new Date(created.getTime() + 2 * 86_400_000);
      demand = applyUpdate(demand, item.update, when);
    }
    demands.push(demand);
  }
  return demands;
}
