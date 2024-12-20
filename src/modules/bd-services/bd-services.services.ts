import { Injectable, OnModuleInit } from '@nestjs/common';
import { entregasTipo } from '../../types/entregasTypes';
import { usuarioTipo } from '../../types/userTypes';
import { clientesTipo } from 'src/types/clientesType';
import { entregaSchema } from '../bd-schemas/entregaModels';
import { connectToDatabase } from 'src/dataBase/connectBd';
import { clientesSchema } from '../bd-schemas/clienteModel';
import { usuarioSchema } from '../bd-schemas/usuarioModelo';
import { WhatsAppService } from '../../services/whatsapp.service';
import { DeleteResult } from 'mongodb';

interface LocalizacaoEntregadorDTO {
  entregadorNome: string;
  localizacao: {
    latitude: number;
    longitude: number;
  };
}

@Injectable()
export class BdServicesService implements OnModuleInit {
  constructor(private readonly whatsappService: WhatsAppService) {}

  async onModuleInit() {
    try {
      // Aguarda o WhatsApp estar pronto
      console.log('Aguardando WhatsApp inicializar...');
      await this.whatsappService.onReady();

      // Aguarda um tempo adicional para garantir que está tudo pronto
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Tenta enviar a mensagem
      console.log('Tentando enviar mensagem de inicialização...');
      await this.enviandoMensagem({
        contato: '554188996458@c.us',
        mensagem: 'Servidor inicializado, WhatsApp funcionando com sucesso.',
      });
      console.log('Mensagem de inicialização enviada com sucesso!');
    } catch (error) {
      console.error('Erro durante a inicialização:', error);
      // Não vamos deixar o erro parar a inicialização do módulo
    }
  }

  async autenticandoUsuario(dados: { userName: string; senha: string }) {
    const conexaoUsuarios = await connectToDatabase();
    const modeloUsuarios = conexaoUsuarios.model(
      'usuarios',
      usuarioSchema,
      'usuariosSchema',
    );
    const usuarioEncontrado = (await modeloUsuarios.findOne({
      userName: dados.userName,
      senha: dados.senha,
    })) as usuarioTipo;
    console.log(usuarioEncontrado.userName + ' foi autenticado com Sucesso!');
    const todosUsuarios = (await modeloUsuarios.find()) as usuarioTipo[];
    return { usuarioLogado: usuarioEncontrado, todosUsuarios: todosUsuarios };
  }

  async todosUsuariosBd() {
    const conexaoUsuarios = await connectToDatabase();
    const modeloUsuarios = conexaoUsuarios.model(
      'usuarios',
      usuarioSchema,
      'usuariosSchema',
    );
    const allUsers = await modeloUsuarios.find();
    console.log('Pegando todos usuários do banco de dados.');
    return allUsers;
  }

  async atualizandoUsuarios(usuarioUppdate: usuarioTipo) {
    const conexaoUsuarios = await connectToDatabase();
    const modeloUsuarios = conexaoUsuarios.model(
      'usuarios',
      usuarioSchema,
      'usuariosSchema',
    );
    const userEntregaBD = await modeloUsuarios.updateOne(
      { userName: usuarioUppdate.userName },
      { $set: usuarioUppdate },
    );
    console.log(
      'Status da atualização da coordenada do usuário: ' +
        userEntregaBD.acknowledged,
    );
    const allUsers = await modeloUsuarios.find();
    console.log('Pegando todos usuários do banco de dados.');
    return allUsers;
  }

  dataDeHoje() {
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesHoje = hoje.getMonth() + 1;
    const anoHoje = hoje.getFullYear();
    return [diaHoje, mesHoje, anoHoje];
  }

  async entregasDoDia() {
    const dataHoje = this.dataDeHoje();
    const conexao = await connectToDatabase();
    const conexaoEntregas = conexao.model(
      'entregas',
      entregaSchema,
      'entregaschemas',
    );
    const todasEntregas = await conexaoEntregas.find({ dia: dataHoje });
    console.log('Pegando todas entregas do Banco de Dados.');
    return todasEntregas;
  }

  async criandoEntrega(entrega: entregasTipo) {
    const conexao = await connectToDatabase();
    const connEntrega = conexao.model(
      'entregas',
      entregaSchema,
      'entregaschemas',
    );

    const entregaGerada = new connEntrega(entrega);
    await entregaGerada.save().then(() => {
      console.log('salvo com sucesso!');
    });
    const dataHoje = this.dataDeHoje();
    const todasEntregas = await connEntrega.find({
      dia: dataHoje,
    });
    console.log('Retornando as entregas do dia.');
    return todasEntregas;
  }

  async atualziandoEntregas(entregaUpdate: entregasTipo) {
    console.log(entregaUpdate);
    const dataHoje = this.dataDeHoje();
    const conexao = await connectToDatabase();
    const modelEntrega = conexao.model(
      'entregas',
      entregaSchema,
      'entregaschemas',
    );
    const userEntregaBD = await modelEntrega.updateOne(
      { id: entregaUpdate.id },
      { $set: entregaUpdate },
    );
    console.log(
      userEntregaBD.matchedCount === 0
        ? 'Nenhum documento encontrado com esse ID.'
        : userEntregaBD.modifiedCount === 0
          ? 'Nenhuma modificação foi feita.'
          : 'Documento atualizado com sucesso.',
    );
    const minhasEntregas = await modelEntrega.find({ dia: dataHoje });
    return minhasEntregas;
  }

  async deletarEntrega(entregaDelete: entregasTipo) {
    const dataHoje = this.dataDeHoje();
    console.log(entregaDelete);
    const conexao = await connectToDatabase();
    const modelEntrega = conexao.model(
      'entregas',
      entregaSchema,
      'entregaschemas',
    );
    const entregaGerada = new modelEntrega(entregaDelete);
    const retornoDel = await modelEntrega.deleteOne({ id: entregaDelete.id });

    if (retornoDel.deletedCount === 0) {
      console.log('Entrega não encontrada');
    }

    const minhasEntregas = await modelEntrega.find({
      dia: dataHoje,
    });

    return minhasEntregas;
  }

  async meusClientes() {
    // const connClientes = await dataConectClientes();
    const conexao = await connectToDatabase();
    const modelClientes = conexao.model(
      'clientesEco',
      clientesSchema,
      'clientesEco',
    );
    console.log('Clientes solicitados do banco de dados');
    const todosClientes = await modelClientes.find({});
    return todosClientes;
  }

  async todasEntregasRelatorio() {
    const conexao = await connectToDatabase();
    const modelEntrega = conexao.model(
      'entregas',
      entregaSchema,
      'entregaschemas',
    );
    console.log('Entregas solicitadas do banco de dados para relatorio');
    const entregasRelatorio = await modelEntrega.find({});
    return entregasRelatorio;
  }

  async criandoCliente(cliente: clientesTipo) {
    const conexao = await connectToDatabase();
    const modelClientes = conexao.model(
      'clientesEco',
      clientesSchema,
      'clientesEco',
    );

    const clienteGerado = new modelClientes(cliente);
    await clienteGerado.save().then(() => {
      console.log('salvo com sucesso!');
    });
    const todosClientes = await modelClientes.find({});
    console.log('Pegando todos os Clientes do Banco de Dados.');
    return todosClientes;
  }

  async atualizandoCliente(cliente: clientesTipo) {
    console.log(cliente);
    const conexao = await connectToDatabase();
    const modelClientes = conexao.model(
      'clientesEco',
      clientesSchema,
      'clientesEco',
    );
    const clienteGerado = new modelClientes(cliente);
    const userCliente = await clienteGerado.updateOne(
      { id: cliente.id }, // Encontra o documento pelo ID
      {
        $set: cliente,
      },
    );
    if (userCliente.matchedCount === 0) {
      console.log('Nenhum documento encontrado com esse ID.');
    } else if (userCliente.modifiedCount === 0) {
      console.log('Nenhuma modificação foi feita.');
    } else {
      console.log('Documento atualizado com sucesso.');
    }

    const todosClientes = await modelClientes.find({});
    console.log('Pegando todos os Clientes do Banco de Dados.');
    return todosClientes;
  }

  async deletandoCliente(cliente: clientesTipo) {
    console.log(cliente);
    const conexao = await connectToDatabase();
    const modelClientes = conexao.model(
      'clientesEco',
      clientesSchema,
      'clientesEco',
    );
    const retornoDel = (await modelClientes.deleteOne({
      id: cliente.id,
    })) as DeleteResult;

    if (retornoDel.deletedCount === 0) {
      console.log('Cliente não encontrado');
    }

    const todosClientes = await modelClientes.find({});
    console.log('Pegando todos os Clientes do Banco de Dados.');

    return todosClientes;
  }

  async todosUsuariosBanco() {
    /*** Estabelecer conexão com o banco de dados de usuários. */
    const conexao = await connectToDatabase();
    const modeloUsuarios = conexao.model(
      'usuarios',
      usuarioSchema,
      'usuariosSchema',
    );
    /*** Fazer a busca pelo usuário no banco de dados. */
    const allUsers = await modeloUsuarios.find({});
    console.log('Pegando todos usuários do banco de dados.');
    return allUsers;
  }

  async enviandoMensagem(dados: {
    contato: string;
    mensagem: string;
  }): Promise<void> {
    try {
      // Verifica se o WhatsApp está pronto antes de tentar enviar
      if (!(await this.whatsappService.isClientReady())) {
        console.log('Aguardando WhatsApp ficar pronto...');
        await this.whatsappService.onReady();
      }
      await this.whatsappService.sendMessage(dados.contato, dados.mensagem);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async obtendoLocalizacaoEntrega(
    dados: LocalizacaoEntregadorDTO,
  ): Promise<void> {
    try {
      await this.whatsappService.sendLocation(
        '554188996458@c.us',
        dados.localizacao.latitude,
        dados.localizacao.longitude,
      );
      console.log(
        `Localização do entregador ${dados.entregadorNome} enviada com sucesso`,
      );
    } catch (error) {
      console.error('Erro ao enviar localização:', error);
      throw error;
    }
  }
}
