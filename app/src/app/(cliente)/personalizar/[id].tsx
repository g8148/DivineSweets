import { useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useProduto } from '@/api/produtos';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Campo } from '@/components/Campo';
import { ListaOpcoes } from '@/components/ListaOpcoes';
import { PrecoRodape } from '@/components/PrecoRodape';
import { Rolagem } from '@/components/Rolagem';
import { SeletorQuantidade } from '@/components/SeletorQuantidade';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { Camera, Images } from '@/components/icones';
import { calcularSubtotal } from '@divine/shared';
import { useRascunho } from '@/state/RascunhoPedidoContext';
import { cores, espaco, raio } from '@/theme';

export default function Personalizar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: produto, isPending, isError, refetch } = useProduto(id);
  const { rascunho, atualizar } = useRascunho();

  const [avisoFoto, setAvisoFoto] = useState('');
  // Só o fato de já ter havido uma tentativa fica guardado. Guardar a lista de
  // grupos pendentes deixava o "Escolha uma opção" na tela depois de a pessoa
  // escolher: o aviso só sumiria no toque seguinte em "Escolher data".
  const [tentouAvancar, setTentouAvancar] = useState(false);

  if (isPending) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Personalizar" comVoltar />
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      </View>
    );
  }

  if (isError || !produto || !rascunho) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Personalizar" comVoltar />
        <Vazio
          mensagem="Não foi possível carregar as opções deste doce."
          acao={{ rotulo: 'Tentar novamente', aoTocar: () => refetch() }}
        />
      </View>
    );
  }

  // Os grupos vêm embutidos na resposta: não há mais consulta ao catálogo do
  // pacote compartilhado. O preço continua sendo calculado aqui, para responder
  // ao toque sem esperar a rede — mas a partir dos deltas do banco, e não dos
  // congelados no código, senão o total mostrado divergiria do cobrado.
  const grupos = produto.grupos;
  const subtotal = calcularSubtotal(produto, rascunho);

  const pendentes = grupos
    .filter((grupo) => grupo.obrigatorio && !rascunho.selecoes[grupo.id])
    .map((grupo) => grupo.id);

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      setAvisoFoto('Precisamos da câmera para anexar a referência. Você pode seguir sem foto.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!resultado.canceled) atualizar({ fotoUri: resultado.assets[0].uri });
  }

  async function escolherDaGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      setAvisoFoto('Precisamos do acesso às fotos para anexar a referência. Você pode seguir sem foto.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!resultado.canceled) atualizar({ fotoUri: resultado.assets[0].uri });
  }

  function aoAvancar() {
    if (!rascunho) return;
    setTentouAvancar(true);
    if (pendentes.length > 0) return;

    router.push('/(cliente)/entrega');
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo={produto.nome} subtitulo="Personalize seu pedido" comVoltar />

      <Rolagem contentContainerStyle={styles.conteudo}>
        {grupos.map((grupo) => (
          <View key={grupo.id} style={styles.grupo}>
            <Texto peso="semibold">
              {grupo.titulo}
              {grupo.obrigatorio ? <Texto cor={cores.alertaTexto}> *</Texto> : null}
            </Texto>

            <ListaOpcoes
              opcoes={grupo.opcoes}
              selecionadaId={rascunho.selecoes[grupo.id]}
              aoSelecionar={(opcaoId) =>
                atualizar({ selecoes: { ...rascunho.selecoes, [grupo.id]: opcaoId } })
              }
            />

            {tentouAvancar && pendentes.includes(grupo.id) && (
              <Texto variante="legenda" cor={cores.alertaTexto}>
                Escolha uma opção
              </Texto>
            )}
          </View>
        ))}

        {produto.permiteMensagem && (
          <View style={styles.grupo}>
            <Campo
              rotulo="Mensagem no doce"
              valor={rascunho.mensagem}
              aoMudar={(mensagem) => atualizar({ mensagem })}
              placeholder="Ex.: Parabéns, Helena!"
              maxLength={60}
              multilinha
            />
          </View>
        )}

        {produto.permiteFoto && (
          <View style={styles.grupo}>
            <Texto peso="semibold">Foto de referência</Texto>

            <View style={styles.botoesFoto}>
              <Botao
                titulo="Tirar foto"
                onPress={tirarFoto}
                variante="secundario"
                style={styles.botaoFoto}
                icone={<Camera size={20} color={cores.vinho} strokeWidth={2} />}
              />
              <Botao
                titulo="Galeria"
                onPress={escolherDaGaleria}
                variante="secundario"
                style={styles.botaoFoto}
                icone={<Images size={20} color={cores.vinho} strokeWidth={2} />}
              />
            </View>

            {avisoFoto ? (
              <Texto variante="legenda" cor={cores.alertaTexto}>
                {avisoFoto}
              </Texto>
            ) : null}

            {rascunho.fotoUri ? (
              <View>
                <Image source={{ uri: rascunho.fotoUri }} style={styles.miniatura} contentFit="cover" />
                <Pressable onPress={() => atualizar({ fotoUri: null })} style={styles.remover}>
                  <Texto variante="legenda" cor={cores.alertaTexto}>
                    Remover foto
                  </Texto>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.grupo}>
          <Texto peso="semibold">Quantidade</Texto>
          <SeletorQuantidade
            valor={rascunho.quantidade}
            aoMudar={(quantidade) => atualizar({ quantidade })}
          />
        </View>
      </Rolagem>

      <PrecoRodape valor={subtotal} rotuloBotao="Escolher data" aoPressionar={aoAvancar} />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  carregando: { marginTop: espaco.xl },
  conteudo: { padding: espaco.md, paddingBottom: 140, gap: espaco.lg },
  grupo: { gap: espaco.sm },
  botoesFoto: { flexDirection: 'row', gap: espaco.sm },
  botaoFoto: { flex: 1 },
  miniatura: { width: 120, height: 120, borderRadius: raio.md },
  remover: { paddingVertical: espaco.sm },
});
