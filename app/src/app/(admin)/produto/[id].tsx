import { useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Campo } from '@/components/Campo';
import { Cartao } from '@/components/Cartao';
import { Chip } from '@/components/Chip';
import { Texto } from '@/components/Texto';
import { grupos } from '@divine/shared';
import { categorias } from '@divine/shared';
import { usePedidos } from '@/state/PedidosContext';
import { cores, espaco, raio } from '@/theme';
import type { Categoria } from '@divine/shared';
import { imagemDoProduto } from '@/data/imagens';

// O bundler resolve `require` estaticamente, então um produto criado no protótipo
// não tem como apontar para um arquivo novo. Ele herda esta imagem.
const IMAGEM_PADRAO = require('@/assets/produtos/decorado.jpg');

function paraKebab(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function FormularioProduto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { produtosAdmin, salvarProduto } = usePedidos();
  const insets = useSafeAreaInsets();

  const criando = id === 'novo';
  const existente = criando ? undefined : produtosAdmin.find((p) => p.id === id);

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [descricao, setDescricao] = useState(existente?.descricao ?? '');
  // O campo é digitado em reais; o domínio guarda centavos.
  const [preco, setPreco] = useState(existente ? (existente.precoBase / 100).toFixed(2).replace('.', ',') : '');
  const [categoria, setCategoria] = useState<Categoria>(existente?.categoria ?? 'cookies');
  const [gruposIds, setGruposIds] = useState<string[]>(existente?.gruposIds ?? []);
  const [permiteMensagem, setPermiteMensagem] = useState(existente?.permiteMensagem ?? false);
  const [permiteFoto, setPermiteFoto] = useState(existente?.permiteFoto ?? false);

  const [erroNome, setErroNome] = useState('');
  const [erroPreco, setErroPreco] = useState('');
  const [erroGrupos, setErroGrupos] = useState('');

  function alternarGrupo(grupoId: string) {
    setGruposIds((atuais) =>
      atuais.includes(grupoId) ? atuais.filter((g) => g !== grupoId) : [...atuais, grupoId],
    );
  }

  function salvar() {
    const precoNumero = Math.round(Number(preco.replace(',', '.')) * 100);

    const problemaNome = nome.trim() ? '' : 'Informe o nome';
    const problemaPreco =
      !Number.isFinite(precoNumero) || precoNumero <= 0 ? 'Informe um preço válido' : '';
    const problemaGrupos =
      gruposIds.length === 0 ? 'Escolha pelo menos um grupo de personalização' : '';

    setErroNome(problemaNome);
    setErroPreco(problemaPreco);
    setErroGrupos(problemaGrupos);
    if (problemaNome || problemaPreco || problemaGrupos) return;

    salvarProduto({
      id: existente?.id ?? `${paraKebab(nome)}-${Date.now()}`,
      nome: nome.trim(),
      categoria,
      descricao: descricao.trim(),
      precoBase: precoNumero,
      gruposIds,
      permiteMensagem,
      permiteFoto,
    });

    router.back();
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo={criando ? 'Novo produto' : 'Editar produto'} comVoltar />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <Image source={existente ? imagemDoProduto(existente.id) : IMAGEM_PADRAO} style={styles.foto} contentFit="cover" />
          <Texto variante="legenda" cor={cores.cinzaEscuro}>
            A troca de imagem não está disponível neste protótipo.
          </Texto>
        </Cartao>

        <Cartao style={styles.cartao}>
          <Campo rotulo="Nome" valor={nome} aoMudar={setNome} erro={erroNome} placeholder="Nome do doce" />
          <Campo
            rotulo="Descrição"
            valor={descricao}
            aoMudar={setDescricao}
            placeholder="Como é feito, sabores, diferenciais"
            multilinha
          />
          <Campo
            rotulo="Preço-base (R$)"
            valor={preco}
            aoMudar={setPreco}
            erro={erroPreco}
            placeholder="0,00"
            teclado="decimal-pad"
          />
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Categoria</Texto>
          <View style={styles.opcoes}>
            {categorias.map((c) => (
              <Chip
                key={c.id}
                rotulo={c.nome}
                selecionado={categoria === c.id}
                onPress={() => setCategoria(c.id)}
              />
            ))}
          </View>
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Grupos de personalização</Texto>
          <View style={styles.opcoes}>
            {Object.values(grupos).map((grupo) => (
              <Chip
                key={grupo.id}
                rotulo={grupo.titulo}
                selecionado={gruposIds.includes(grupo.id)}
                onPress={() => alternarGrupo(grupo.id)}
              />
            ))}
          </View>
          {erroGrupos ? (
            <Texto variante="legenda" cor={cores.alertaTexto}>
              {erroGrupos}
            </Texto>
          ) : null}
        </Cartao>

        <Cartao style={styles.cartao}>
          <View style={styles.linhaSwitch}>
            <Texto style={styles.rotuloSwitch}>Permite mensagem</Texto>
            <Switch
              value={permiteMensagem}
              onValueChange={setPermiteMensagem}
              trackColor={{ false: cores.borda, true: cores.vinhoClaro }}
              thumbColor={cores.vinho}
            />
          </View>
          <View style={styles.linhaSwitch}>
            <Texto style={styles.rotuloSwitch}>Permite foto de referência</Texto>
            <Switch
              value={permiteFoto}
              onValueChange={setPermiteFoto}
              trackColor={{ false: cores.borda, true: cores.vinhoClaro }}
              thumbColor={cores.vinho}
            />
          </View>
        </Cartao>
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: espaco.md + insets.bottom }]}>
        <Botao titulo={criando ? 'Criar produto' : 'Salvar alterações'} onPress={salvar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: 110 },
  cartao: { padding: espaco.md, gap: espaco.sm },
  foto: { width: '100%', height: 160, borderRadius: raio.md },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotuloSwitch: { flexShrink: 1 },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    padding: espaco.md,
  },
});
