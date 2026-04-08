-- ============================================================
-- ESTIMIO — Seed dati demo realistici
-- ============================================================
-- Esegui questo script DOPO lo schema.sql su Supabase
-- Nota: i profili richiedono un utente Supabase Auth creato prima

-- ─── Zone Insights ────────────────────────────────────────────────────────────

insert into zone_insights
  (city, zone, microzone, avg_price_sqm, min_price_sqm, max_price_sqm, listings_count, sold_count, rent_count, trend_delta, period_label)
values
  ('Roma', 'Prati', 'Cola di Rienzo', 4650, 3800, 6200, 142, 38, 55, 3.2, 'Q1 2024'),
  ('Roma', 'EUR', 'Viale Europa', 4820, 3900, 6800, 98, 22, 41, 4.8, 'Q1 2024'),
  ('Roma', 'Esquilino', 'Merulana', 3250, 2500, 4400, 87, 19, 62, -0.8, 'Q1 2024'),
  ('Roma', 'Testaccio', null, 4100, 3300, 5500, 64, 17, 38, 2.1, 'Q1 2024'),
  ('Roma', 'Trastevere', null, 5200, 4000, 7500, 76, 14, 72, 5.4, 'Q1 2024'),
  ('Roma', 'Ostiense', null, 3800, 2800, 5200, 55, 12, 30, 1.5, 'Q1 2024'),
  ('Roma', 'Nomentano', null, 3400, 2600, 4800, 91, 25, 44, 0.9, 'Q1 2024'),
  ('Roma', 'Parioli', null, 5800, 4500, 8500, 48, 10, 28, 2.7, 'Q1 2024'),
  ('Roma', 'Flaminio', null, 5100, 3900, 7200, 61, 15, 35, 3.8, 'Q1 2024'),
  ('Roma', 'Monteverde', null, 4200, 3100, 5800, 78, 20, 42, 1.2, 'Q1 2024'),
  ('Roma', 'Prati', 'Cola di Rienzo', 4620, 3750, 6150, 138, 35, 52, 2.1, 'Q4 2023'),
  ('Roma', 'EUR', 'Viale Europa', 4790, 3850, 6720, 94, 20, 38, 3.2, 'Q4 2023'),
  ('Roma', 'Esquilino', 'Merulana', 3280, 2520, 4450, 90, 22, 65, -1.2, 'Q4 2023'),
  ('Milano', 'Navigli', null, 6200, 4800, 8500, 120, 28, 85, 4.1, 'Q1 2024'),
  ('Milano', 'Brera', null, 8500, 6500, 12000, 65, 12, 45, 3.6, 'Q1 2024'),
  ('Milano', 'Porta Romana', null, 5800, 4200, 7800, 98, 22, 62, 5.2, 'Q1 2024');

-- ─── Comparables pubblici (non legati a valutazione) ─────────────────────────

insert into comparables
  (source, title, address, city, zone, latitude, longitude, property_type, price, area_sqm, price_per_sqm, condition, floor, rooms, bathrooms, energy_class, image_url, similarity_score, distance_km, listing_date)
values
  ('idealista', 'Trilocale Prati - ottime condizioni', 'Via Candia, 56', 'Roma', 'Prati', 41.9051, 12.4598, 'appartamento', 415000, 92, 4511, 'buono', 2, 3, 2, 'C', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop', 0.91, 0.4, '2024-01-15'),
  ('immobiliare.it', 'Trilocale ristrutturato Prati/Clodio', 'Piazza dei Quiriti, 12', 'Roma', 'Prati', 41.9028, 12.4612, 'appartamento', 448000, 98, 4571, 'ottimo', 4, 3, 2, 'B', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop', 0.87, 0.6, '2024-02-05'),
  ('idealista', 'Appartamento 3 locali con box', 'Via Barletta, 8', 'Roma', 'Prati', 41.9082, 12.4671, 'appartamento', 395000, 88, 4489, 'buono', 3, 3, 1, 'D', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop', 0.83, 0.8, '2023-12-20'),
  ('casa.it', 'Bilocale Esquilino', 'Via Labicana, 30', 'Roma', 'Esquilino', 41.8895, 12.5028, 'appartamento', 192000, 60, 3200, 'discreto', 1, 2, 1, 'E', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop', 0.78, 1.2, '2024-03-01'),
  ('idealista', 'Quadrilocale EUR - ottimo stato', 'Viale Civiltà del Lavoro, 55', 'Roma', 'EUR', 41.8265, 12.4692, 'appartamento', 530000, 108, 4907, 'ottimo', 6, 4, 2, 'A1', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop', 0.89, 0.5, '2024-02-18'),
  ('immobiliare.it', 'Appartamento luminoso EUR', 'Via Cristoforo Colombo, 200', 'Roma', 'EUR', 41.8248, 12.4714, 'appartamento', 498000, 105, 4743, 'buono', 4, 4, 2, 'B', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=500&fit=crop', 0.85, 0.9, '2024-01-28'),
  ('idealista', 'Attico Trastevere terrazza', 'Via della Lungaretta, 45', 'Roma', 'Trastevere', 41.8887, 12.4703, 'attico', 680000, 120, 5667, 'ottimo', 5, 4, 2, 'A2', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=500&fit=crop', 0.72, 2.1, '2024-03-10'),
  ('omi', 'Appartamento Testaccio', 'Via Galvani, 22', 'Roma', 'Testaccio', 41.8778, 12.4764, 'appartamento', 345000, 82, 4207, 'buono', 2, 3, 1, 'C', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=500&fit=crop', 0.80, 1.5, '2024-02-12');
