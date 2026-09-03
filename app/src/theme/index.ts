export const cores = {
  vinho: '#721d24',
  vinhoClaro: '#9a3b43',
  rosaCreme: '#f6e5df',
  rosaClaro: '#fdf5f2',
  branco: '#ffffff',
  sucesso: '#d4edda',
  sucessoTexto: '#1e6b33',
  alerta: '#f8d7da',
  alertaTexto: '#9b2c2c',
  cinza: '#b0b0b0',
  cinzaEscuro: '#6b6b6b',
  borda: '#ecd9d3',
} as const;

export const espaco = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const raio = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const fonte = {
  regular: 'Montserrat-Regular',
  semibold: 'Montserrat-SemiBold',
  bold: 'Montserrat-Bold',
} as const;

export const tamanhoFonte = {
  titulo: 28,
  subtitulo: 20,
  corpo: 15,
  legenda: 13,
  preco: 22,
} as const;

export const sombra = {
  shadowColor: '#721d24',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

export const theme = { cores, espaco, raio, fonte, tamanhoFonte, sombra };
