/**
 * Erro com status HTTP. O `codigo` é lido pelo app para distinguir falhas que
 * pedem tratamento diferente — `data_indisponivel`, por exemplo, reabre o
 * calendário em vez de só mostrar a mensagem.
 *
 * Os campos são declarados explicitamente porque o Node executa TypeScript
 * apenas removendo os tipos, e `constructor(public status: number)` exigiria
 * uma transformação de verdade.
 */
export class ErroApi extends Error {
  status: number;
  codigo?: string;

  constructor(status: number, message: string, codigo?: string) {
    super(message);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = codigo;
  }
}
