import { Tabs } from 'expo-router';
import { ReceiptText, Store, User } from '@/components/icones';
import { cores, fonte } from '@/theme';

export default function TabsCliente() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.vinho,
        tabBarInactiveTintColor: cores.cinza,
        tabBarStyle: { backgroundColor: cores.branco, borderTopColor: cores.borda },
        tabBarLabelStyle: { fontFamily: fonte.semibold, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color }) => <Store size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Meus Pedidos',
          tabBarIcon: ({ color }) => <ReceiptText size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
