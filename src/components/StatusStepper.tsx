import { StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { ETAPAS, ORDEM_STATUS } from '@/data/status';
import { cores, espaco } from '@/theme';
import type { StatusPedido } from '@/types';

export function StatusStepper({ status }: { status: StatusPedido }) {
  if (status === 'recusado') {
    return (
      <View style={styles.recusado}>
        <Texto peso="semibold" cor={cores.alertaTexto}>
          Pedido recusado
        </Texto>
      </View>
    );
  }

  const atual = ORDEM_STATUS.indexOf(status);

  return (
    <View style={styles.linha}>
      {ETAPAS.map((etapa, indice) => {
        const concluida = indice <= atual;
        return (
          <View key={etapa.id} style={styles.etapa}>
            <View style={styles.trilho}>
              {indice > 0 && (
                <View style={[styles.conector, { backgroundColor: concluida ? cores.vinho : cores.borda }]} />
              )}
              <View style={[styles.bolinha, { backgroundColor: concluida ? cores.vinho : cores.borda }]} />
              {indice < ETAPAS.length - 1 && (
                <View
                  style={[
                    styles.conector,
                    { backgroundColor: indice < atual ? cores.vinho : cores.borda },
                  ]}
                />
              )}
            </View>
            <Texto
              variante="legenda"
              peso={concluida ? 'semibold' : 'regular'}
              cor={concluida ? cores.vinho : cores.cinzaEscuro}
              style={styles.rotulo}
            >
              {etapa.rotulo}
            </Texto>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', paddingVertical: espaco.md },
  etapa: { flex: 1, alignItems: 'center' },
  trilho: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  conector: { flex: 1, height: 2 },
  bolinha: { width: 14, height: 14, borderRadius: 7 },
  rotulo: { marginTop: espaco.sm, textAlign: 'center' },
  recusado: {
    backgroundColor: cores.alerta,
    padding: espaco.md,
    borderRadius: 12,
    alignItems: 'center',
  },
});
