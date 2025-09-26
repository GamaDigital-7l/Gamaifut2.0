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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, setHours, setMinutes } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Team, Group, Round, Profile } from '@/types';

interface Official extends Profile {
  role: 'official';
}

interface CreateMatchDialogProps {
  championshipId: string;
  teams: Team[];
  groups: Group[];
  rounds: Round[];
  onMatchCreated: () => void;
}

export function CreateMatchDialog({ championshipId, teams, groups, rounds, onMatchCreated }: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState<string | undefined>(undefined);
  const [team2Id, setTeam2Id] = useState<string | undefined>(undefined);
  const [matchDate, setMatchDate] = useState<Date | undefined>(undefined);
  const [matchTime, setMatchTime] = useState<string>('');
  const [location, setLocation] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [roundId, setRoundId] = useState<string | undefined>(undefined);
  const [assignedOfficialId, setAssignedOfficialId] = useState<string | undefined>(undefined);
  const [officials, setOfficials] = useState<Profile[]>([]); // Changed to Profile[] to include admins/users
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session, userProfile } = useSession();

  // Fetch officials and set default assigned official
  useEffect(() => {
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
        // Set default official if available
        if (officialProfiles.length > 0) {
          setAssignedOfficialId(officialProfiles[0].id);
        } else if (userProfile) {
          // Fallback: assign to the current user if no officials are registered
          setAssignedOfficialId(userProfile.id);
        }
      }
    };
    fetchAndSetOfficials();
  }, [userProfile]); // Re-run if userProfile changes (e.g., after login)

  // Auto-assign group if both teams are from the same group
  useEffect(() => {
    if (team1Id && team2Id) {
      const team1 = teams.find(t => t.id === team1Id);
      const team2 = teams.find(t => t.id === team2Id);

      if (team1?.group_id && team1.group_id === team2?.group_id) {
        setGroupId(team1.group_id);
      } else {
        setGroupId(undefined); // Clear group if teams are from different groups or one is not in a group
      }
    } else {
      setGroupId(undefined); // Clear group if not both teams are selected
    }
  }, [team1Id, team2Id, teams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1Id || !team2Id || !session?.user) {
      showError("Você precisa selecionar os dois times.");
      return;
    }
    if (team1Id === team2Id) {
      showError("Os times devem ser diferentes.");
      return;
    }

    setIsSubmitting(true);

    let finalMatchDate = matchDate;
    if (finalMatchDate && matchTime) {
      const [hours, minutes] = matchTime.split(':').map(Number);
      finalMatchDate = setHours(finalMatchDate, hours);
      finalMatchDate = setMinutes(finalMatchDate, minutes);
    }

    const { error } = await supabase
      .from('matches')
      .insert([{ 
        championship_id: championshipId,
        user_id: session.user.id,
        team1_id: team1Id,
        team2_id: team2Id,
        match_date: finalMatchDate?.toISOString() || null,
        location: location.trim() === '' ? null : location.trim(),
        group_id: groupId || null,
        round_id: roundId || null,
        assigned_official_id: assignedOfficialId || null,
      }]);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao criar partida: ${error.message}`);
    } else {
      showSuccess("Partida criada com sucesso!");
      setTeam1Id(undefined);
      setTeam2Id(undefined);
      setMatchDate(undefined);
      setMatchTime('');
      setLocation('');
      setGroupId(undefined);
      setRoundId(undefined);
      // Keep assignedOfficialId as default or current user, don't reset
      setOpen(false);
      onMatchCreated();
    }
  };

  const availableTeamsForTeam2 = teams.filter(t => t.id !== team1Id);
  const availableTeamsForTeam1 = teams.filter(t => t.id !== team2Id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={teams.length < 2}>Agendar Partida</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar Nova Partida</DialogTitle>
          <DialogDescription>
            Selecione os dois times que irão se enfrentar e defina a data, local, grupo, rodada e mesário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team1" className="text-right">
                Time 1
              </Label>
              <Select value={team1Id} onValueChange={setTeam1Id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o time da casa" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeamsForTeam1.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team2" className="text-right">
                Time 2
              </Label>
               <Select value={team2Id} onValueChange={setTeam2Id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o time visitante" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeamsForTeam2.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isSubmitting ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}