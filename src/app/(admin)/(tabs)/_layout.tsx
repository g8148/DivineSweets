import { Tabs } from 'expo-router';
import { Calendar, ClipboardList, Tags } from '@/components/icones';
import { cores, fonte } from '@/theme';

export default function TabsAdmin() {
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
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color }) => <Tags size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
