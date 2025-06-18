
'use server';
/**
 * @fileOverview A product assistant AI flow for TeslaTech.
 *
 * - askProductAssistant - A function to interact with the product assistant.
 * - ProductAssistantFlowInput - The input type for the askProductAssistant function.
 * - ProductAssistantFlowOutput - The return type for the askProductAssistant function.
 */

import { ai } from '@/ai/genkit';
import { Product, getAllProductsFromDB } from '@/lib/data'; // Updated import
import { z } from 'genkit';

// Zod schema for product data, mirroring the Product interface from lib/data.ts
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  image: z.string().describe("URL de la imagen del producto"),
  description: z.string().optional().describe("Breve descripción del producto"),
  isBestseller: z.boolean().optional(),
  rating: z.number().optional().describe("Calificación del producto de 1 a 5"),
  stock: z.number().optional().describe("Número de unidades en stock"),
  features: z.array(z.string()).optional().describe("Lista de características clave del producto"),
  brand: z.string().optional().describe("Marca del producto (fabricante de la tarjeta o componente, ej. ASUS, MSI, Corsair)"),
  gpuChipset: z.enum(['NVIDIA', 'AMD']).optional().describe("Fabricante del chipset GPU, solo aplica a Tarjetas Gráficas (ej. NVIDIA, AMD)"),
  categorySlug: z.string().optional().describe("Slug de la categoría del producto"), // Added categorySlug
});

const ProductAssistantFlowInputSchema = z.object({
  query: z.string().describe('La pregunta del usuario sobre los productos.'),
});
export type ProductAssistantFlowInput = z.infer<typeof ProductAssistantFlowInputSchema>;

const ProductAssistantFlowOutputSchema = z.object({
  response: z.string().describe('La respuesta del asistente de IA a la consulta del usuario.'),
});
export type ProductAssistantFlowOutput = z.infer<typeof ProductAssistantFlowOutputSchema>;

const ProductAssistantPromptInputSchema = z.object({
  query: z.string().describe('La pregunta del usuario sobre los productos.'),
  products: z.array(ProductSchema).describe('La lista de productos disponibles con sus detalles.'),
});

export async function askProductAssistant(input: ProductAssistantFlowInput): Promise<ProductAssistantFlowOutput> {
  const result = await productAssistantFlow({
    query: input.query,
  });
  return result;
}

const productPrompt = ai.definePrompt({
  name: 'productAssistantPrompt',
  input: { schema: ProductAssistantPromptInputSchema },
  output: { schema: ProductAssistantFlowOutputSchema },
  prompt: `¡Hola! Soy tu asistente de compras personal para TeslaTech, tu tienda de confianza para componentes de PC y tecnología de punta. Mi idioma principal es el Español.
Estoy aquí para ayudarte a encontrar los mejores productos, responder tus dudas, comparar opciones y darte recomendaciones basadas exclusivamente en la información de nuestros productos que te muestro a continuación.

Por favor, ten en cuenta:
- Si me pides "todos los productos" o una lista muy general, te pediré amablemente que seas más específico (por ejemplo, "¿qué tarjetas gráficas NVIDIA tienes?" o "muéstrame procesadores AMD"). Puedo darte algunos ejemplos si insistes, pero mostrarte todo el catálogo aquí sería un poco abrumador para ambos. ¡Hay mucho que explorar!
- Si preguntas por un producto, categoría o característica que no esté en mi lista, te lo haré saber con amabilidad y te ofreceré ayuda con lo que sí tenemos.
- No inventaré nada. Mis respuestas se basan 100% en los datos de los productos disponibles.
- Me enfocaré en detalles como nombre, categoría, precio, descripción, marca, chipset GPU (si aplica), stock y características al responder.
- Si tienes un presupuesto o preferencias (ej. "algo económico", "lo mejor para gaming", "CPU por menos de S/500", "GPU NVIDIA potente para 1440p"), ¡dímelo! Así podré ayudarte mejor. Si no está claro, puedo sugerirte opciones variadas.
- Te informaré si un producto está agotado (stock 0 o menor) si tu pregunta se relaciona con su disponibilidad.

Productos Disponibles:
{{#each products}}
- Nombre: {{this.name}}
  Categoría: {{this.category}}
  Precio: S/{{this.price}}
  Descripción: {{this.description}}
  {{#if this.brand}}Marca: {{this.brand}}{{/if}}
  {{#if this.gpuChipset}}Chipset GPU: {{this.gpuChipset}}{{/if}}
  {{#if this.stock}}Stock: {{this.stock}} unidades disponibles{{else}}Stock: Agotado{{/if}}
  {{#if this.rating}}Calificación: {{this.rating}} / 5{{/if}}
  {{#if this.features}}
  Características:
    {{#each this.features}}
    - {{{this}}}
    {{/each}}
  {{/if}}

{{/each}}

Pregunta del usuario: {{{query}}}

Basado en la lista de productos proporcionada, aquí tienes mi respuesta útil y concisa en Español:
`,
});

const productAssistantFlow = ai.defineFlow(
  {
    name: 'productAssistantFlow',
    inputSchema: ProductAssistantFlowInputSchema,
    outputSchema: ProductAssistantFlowOutputSchema,
  },
  async (input) => {
    // Fetch products from Firestore
    const allProductsData: Product[] = await getAllProductsFromDB();

    if (!allProductsData || allProductsData.length === 0) {
      return { response: "Lo siento, parece que no tengo información de productos disponible en este momento. ¡Intentaré tenerla lista pronto!" };
    }

    const { output } = await productPrompt({
      query: input.query,
      products: allProductsData, // Pass Firestore products to the prompt
    });

    if (!output) {
      return { response: "Uhm... parece que me quedé pensando demasiado y no pude generar una respuesta. ¿Podrías intentarlo de nuevo o reformular tu pregunta?" };
    }
    return output;
  }
);

