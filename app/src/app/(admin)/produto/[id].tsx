import { useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGruposDeOpcoes, useSalvarProduto } from '@/api/admin';
import { montarUrl } from '@/api/client';
import { useProduto } from '@/api/produtos';
import { useEnviarImagem } from '@/api/upload';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Campo } from '@/components/Campo';
import { Cartao } from '@/components/Cartao';
import { Rolagem } from '@/components/Rolagem';
import { Seletor, SeletorMultiplo } from '@/components/Seletor';
import { Texto } from '@/components/Texto';
import { categorias, centavosDeTexto, formatarCentavos, mascararMoeda } from '@divine/shared';
import { cores, espaco, raio } from '@/theme';
import type { Categoria } from '@divine/shared';

export default function FormularioProduto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const criando = id === 'novo';

  // A administração precisa abrir também o produto desativado, e é por isso que
  // esta consulta usa o detalhe público só quando o produto está à venda; o
  // caminho de edição parte da listagem administrativa, que já traz os dois.
  const { data: existente, isPending: carregando } = useProduto(criando ? '' : id);
  const grupos = useGruposDeOpcoes();
  const salvarProduto = useSalvarProduto();
  const enviarImagem = useEnviarImagem();
  const insets = useSafeAreaInsets();

  const [pronto, setPronto] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  // O campo é digitado em reais; a API recebe centavos.
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('cookies');
  const [gruposIds, setGruposIds] = useState<string[]>([]);
  const [permiteMensagem, setPermiteMensagem] = useState(false);
  const [permiteFoto, setPermiteFoto] = useState(false);
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);

  // Como nas demais telas, o que fica em estado é só a tentativa; as mensagens
  // vêm do que está preenchido agora e somem assim que o campo é corrigido.
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [aviso, setAviso] = useState('');

  // Uma vez só, quando o produto chega: preencher a cada render descartaria o
  // que a confeiteira estivesse digitando.
  if (!criando && existente && !pronto) {
    setPronto(true);
    setNome(existente.nome);
    setDescricao(existente.descricao);
    setPreco(formatarCentavos(existente.precoBase));
    setCategoria(existente.categoria);
    setGruposIds(existente.grupos.map((g) => g.id));
    setPermiteMensagem(existente.permiteMensagem);
    setPermiteFoto(existente.permiteFoto);
    setImagemUrl(existente.imagemUrl);
  }

  function alternarGrupo(grupoId: string) {
    setGruposIds((atuais) =>
      atuais.includes(grupoId) ? atuais.filter((g) => g !== grupoId) : [...atuais, grupoId],
    );
  }

  async function trocarImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      setAviso('Precisamos do acesso às fotos para trocar a imagem do produto.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (resultado.canceled) return;

    setAviso('');
    try {
      // A imagem sobe agora e o produto guarda só o caminho. Assim o formulário
      // já mostra a foto definitiva, servida pela API, e não a do aparelho.
      const { url } = await enviarImagem.mutateAsync(resultado.assets[0].uri);
      setImagemUrl(url);
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : 'Não foi possível enviar a imagem');
    }
  }

  // A máscara garante que o texto sempre se converte; o que resta conferir é
  // se há valor. O parse à mão (`replace(',', '.')`) recusava "1.234,50", que
  // é exatamente como se escreve um bolo de mil e duzentos reais.
  const precoNumero = centavosDeTexto(preco) ?? 0;
  const problemaNome = nome.trim() ? '' : 'Informe o nome';
  const problemaPreco = precoNumero <= 0 ? 'Informe um preço válido' : '';
  const erroNome = tentouSalvar ? problemaNome : '';
  const erroPreco = tentouSalvar ? problemaPreco : '';

  async function salvar() {
    setTentouSalvar(true);
    setAviso('');
    if (problemaNome || problemaPreco) return;

    try {
      await salvarProduto.mutateAsync({
        id: criando ? undefined : id,
        dados: {
          nome: nome.trim(),
          categoria,
          descricao: descricao.trim(),
          precoBase: precoNumero,
          gruposIds,
          permiteMensagem,
          permiteFoto,
          ...(imagemUrl ? { imagemUrl } : {}),
        },
      });
      router.back();
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : 'Não foi possível salvar o produto');
    }
  }

  if (!criando && carregando) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Editar produto" comVoltar />
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      </View>
    );
  }

  const enviando = salvarProduto.isPending || enviarImagem.isPending;

  return (
    <View style={styles.tela}>
      <Cabecalho titulo={criando ? 'Novo produto' : 'Editar produto'} comVoltar />

      <Rolagem contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <Image
            source={imagemUrl ? { uri: montarUrl(imagemUrl) } : require('@/assets/logomarca.jpg')}
            style={styles.foto}
            contentFit="cover"
          />
          <Botao
            titulo={enviarImagem.isPending ? 'Enviando…' : 'Escolher imagem'}
            variante="secundario"
            desabilitado={enviarImagem.isPending}
            onPress={trocarImagem}
          />
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
            aoMudar={(digitado) => setPreco(mascararMoeda(digitado))}
            erro={erroPreco}
            placeholder="0,00"
            teclado="decimal-pad"
          />
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Categoria</Texto>
          <Seletor
            itens={categorias.map((c) => ({ id: c.id, rotulo: c.nome }))}
            selecionadoId={categoria}
            aoSelecionar={setCategoria}
          />
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Grupos de personalização</Texto>
          {/* Os grupos vêm do banco, e não do catálogo do código: a API confere
              cada id contra a tabela e recusaria um que só existisse aqui. */}
          {grupos.isPending ? (
            <ActivityIndicator color={cores.vinho} style={styles.carregandoGrupos} />
          ) : (
            // Aqui a escolha é múltipla — um doce pode ter recheio e cobertura.
            <SeletorMultiplo
              itens={(grupos.data ?? []).map((grupo) => ({
                id: grupo.id,
                rotulo: grupo.titulo,
                detalhe: grupo.obrigatorio ? 'obrigatório' : undefined,
              }))}
              selecionadosIds={gruposIds}
              aoAlternar={alternarGrupo}
            />
          )}
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

        {aviso ? (
          <Texto variante="legenda" cor={cores.alertaTexto}>
            {aviso}
          </Texto>
        ) : null}
      </Rolagem>

      <View style={[styles.rodape, { paddingBottom: espaco.md + insets.bottom }]}>
        <Botao
          titulo={enviando ? 'Salvando…' : criando ? 'Criar produto' : 'Salvar alterações'}
          onPress={salvar}
          desabilitado={enviando}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: 110 },
  cartao: { padding: espaco.md, gap: espaco.sm },
  carregando: { marginTop: espaco.xl },
  carregandoGrupos: { alignSelf: 'flex-start', paddingVertical: espaco.sm },
  foto: { width: '100%', height: 160, borderRadius: raio.md },
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
