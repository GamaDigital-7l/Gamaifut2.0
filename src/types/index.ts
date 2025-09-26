export interface Championship {
  id: string;
  user_id: string; // Adicionado user_id
  name: string;
  description: string | null;
  created_at: string;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  points_for_win: number;
  sport_type: string;
  gender: string;
  age_category: string;
  tie_breaker_order: string[]; // Added for tie-breaker rules
}

export interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  group_id: string | null;
  championship_id: string;
  groups: { name: string } | null;
}

export interface Group {
  id: string;
  name: string;
  championship_id: string;
  created_at: string;
}

export interface Round {
  id: string;
  name: string;
  order_index: number;
  type: 'group_stage' | 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final';
  championship_id: string;
  created_at: string;
  public_edit_token: string | null; // Novo campo para o token de edição pública
}

-- A representation of a team as returned in a match query
export interface MatchTeam {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  match_date: string | null;
  location: string | null;
  group_id: string | null;
  round_id: string | null;
  team1_yellow_cards: number | null;
  team2_yellow_cards: number | null;
  team1_red_cards: number | null;
  team2_red_cards: number | null;
  team1_fouls: number | null;
  team2_fouls: number | null;
  notes: string | null;
  team1: MatchTeam;
  team2: MatchTeam;
  groups: { name: string } | null;
  rounds: { name: string } | null;
}

export interface Sponsor {
  id: string;
  name: string;
  level: 'ouro' | 'prata' | 'bronze';
  logo_url: string | null;
  target_url: string | null;
  is_active: boolean;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'official' | 'admin';
  email?: string;
}