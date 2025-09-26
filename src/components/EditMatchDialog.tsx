import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, setHours, setMinutes, getHours, getMinutes } from "date-fns"; // Import setHours, setMinutes, getHours, getMinutes
import { CalendarIcon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Group, Round, Team, Match, Profile } from '@/types'; // Import Group and Round from centralized types
import { useSession } from '@/components/SessionProvider'; // Import useSession

interface Official extends Profile {
  role: 'official';
}

interface EditMatchDialogProps {
  match: Match;
  groups: Group[]; // Pass groups
  rounds: Round[]; // Pass rounds
  teams: Team[]; // Pass teams for group auto-assignment
  onMatchUpdated: () => void;
  children: React.ReactNode;
}

export function EditMatchDialog({ match, groups, rounds, teams, onMatchUpdated, children }: EditMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [team1Score, setTeam1Score] = useState(match.team1_score?.toString() ?? '');
  const [team2Score, setTeam2Score] = useState(match.team2_score?.toString() ?? '');
  const [matchDate, setMatchDate] = useState<Date | undefined>(match.match_date ? new Date(match.match_date) : undefined);
  const [matchTime, setMatchTime] = useState<string>(() => { // New state for time
    if (match.match_date) {
      const date = new Date(match.match_date);
      return format(date, 'HH:mm');
    }
    return '';
  });
  const [location, setLocation] = useState(match.location || '');
  const [groupId, setGroupId] = useState<string | undefined>(match.group_id || undefined); // New state for group
  const [roundId, setRoundId] = useState<string | undefined>(match.round_id || undefined); // New state for round
  const [assignedOfficialId, setAssignedOfficialId] = useState<string | undefined>(match.assigned_official_id || undefined); // New state for assigned official
  const [officials, setOfficials] = useState<Profile[]>([]); // State for officials list
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile } = useSession(); // Get current user profile

  // Effect to initialize form fields and fetch officials when dialog opens or match changes
  useEffect(() => {
    if (open) {
      setTeam1Score(match.team1_score?.toString() ?? '');
      setTeam2Score(match.team2_score?.toString() ?? '');
      setMatchDate(match.match_date ? new Date(match.match_date) : undefined);
      setLocation(match.location || '');
      setRoundId(match.round_id || undefined);
      if (match.match_date) {
        const date = new Date(match.match_date);
        setMatchTime(format(date, 'HH:mm'));
      } else {
        setMatchTime('');
      }

      // Fetch officials and set default assigned official
      const fetchAndSetOfficials = async () => {
        const { data: officialProfiles, error: officialError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .eq('role', 'official')
          .order('first_name', { ascending: true });

        if (officialError) {
          console.error('Error fetching officials:', officialError);
          setOfficials([]);
        } else {
          setOfficials(officialProfiles as Profile[]);
          // If no official is assigned to the match, try to assign a default
          if (!match.assigned_official_id) {
            if (officialProfiles.length > 0) {
              setAssignedOfficialId(officialProfiles[0].id);
            } else if (userProfile) {
              setAssignedOfficialId(userProfile.id); // Fallback to current user
            }
          } else {
            setAssignedOfficialId(match.assigned_official_id); // Keep existing official
          }
        }
      };
      fetchAndSetOfficials();
    }
  }, [match, open, userProfile]); // Re-run if match or dialog open state changes

  // Auto-assign group if both teams are from the same group
  useEffect(() => {
    const team1 = teams.find(t => t.id === match.team1_id);
    const team2 = teams.find(t => t.id === match.team2_id);

    if (team1?.group_id && team1.group_id === team2?.group_id) {
      setGroupId(team1.group_id);
    } else {
      setGroupId(undefined); // Clear group if teams are from different groups or one is not in a group
    }
  }, [match.team1_id, match.team2_id, teams]); // Re-run if match teams or all teams change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const score1 = team1Score === '' ? null : parseInt(team1Score, 10);
    const score2 = team2Score === '' ? null : parseInt(team2Score, 10);

    if ((score1 !== null && isNaN(score1)) || (score2 !== null && isNaN(score2))) {
        showError("Os placares devem ser números válidos.");
        setIsSubmitting(false);
        return;
    }

    let finalMatchDate = matchDate;
    if (finalMatchDate && matchTime) {
      const [hours, minutes] = matchTime.split(':').map(Number);
      finalMatchDate = setHours(finalMatchDate, hours);
      finalMatchDate = setMinutes(finalMatchDate, minutes);
    }

    const { error } = await supabase
      .from('matches')
      .update({ 
        team1_score: score1, 
        team2_score: score2,
        match_date: finalMatchDate?.toISOString() || null,
        location: location.trim() === '' ? null : location.trim(),
        group_id: groupId || null,
        round_id: roundId || null,
        assigned_official_id: assignedOfficialId || null, // Include assigned_official_id
      })
      .eq('id', match.id);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao atualizar partida: ${error.message}`);
    } else {
      showSuccess("Partida atualizada com sucesso!");
      setOpen(false);
      onMatchUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Partida</DialogTitle>
          <DialogDescription>
            {`Atualize o placar, data, local, grupo, rodada e mesário da partida entre ${match.team1.name} e ${match.team2.name}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team1_score" className="text-right">
                {match.team1.name}
              </Label>
              <Input
                id="team1_score"
                type="number"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                className="col-span-3"
                placeholder="Placar Time 1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team2_score" className="text-right">
                {match.team2.name}
              </Label>
              <Input
                id="team2_score"
                type="number"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                className="col-span-3"
                placeholder="Placar Time 2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">
                Grupo
              </Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o grupo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="round" className="text-right">
                Rodada
              </Label>
              <Select value={roundId} onValueChange={setRoundId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a rodada (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map(round => (
                    <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matchDate" className="text-right">
                Data
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !matchDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {matchDate ? format(matchDate, "PPP") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={matchDate}
                    onSelect={setMatchDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matchTime" className="text-right">
                Hora
              </Label>
              <Input
                id="matchTime"
                type="time"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Local
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="col-span-3"
                placeholder="Estádio Municipal"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="official" className="text-right">
                Mesário
              </Label>
              <Select value={assignedOfficialId} onValueChange={setAssignedOfficialId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Atribuir mesário (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {officials.map(official => (
                    <SelectItem key={official.id} value={official.id}>
                      {official.first_name} {official.last_name} {official.id === userProfile?.id ? '(Você)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}