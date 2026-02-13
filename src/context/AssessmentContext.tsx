import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { allNutrients, Nutrient } from '@/data/nutrients';
import { allQuestions } from '@/data/symptoms';
import { supabase } from '@/lib/supabase';

export type AppView = 'home' | 'database' | 'assessment' | 'results' | 'booking' | 'admin' | 'reports' | 'profile' | 'shared-report' | 'food-tracker' | 'supplements' | 'blood-tests' | 'meal-plans';


export interface PendingSupplementAdd {
  name: string;
  dosage: string;
  dosage_unit: string;
  time_of_day: string;
  frequency: string;
  nutrient_ids: string[];
  notes: string;
  source: string; // e.g., "Blood test deficiency: Vitamin D"
}

export interface DeficiencyResult {
  nutrient: Nutrient;
  score: number;
  priority: 'critical' | 'moderate' | 'low';
  triggeringSymptoms: string[];
}

interface AssessmentState {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  answers: Record<string, boolean>;
  setAnswer: (questionId: string, value: boolean) => void;
  resetAssessment: () => void;
  results: DeficiencyResult[];
  calculateResults: () => void;
  assessmentComplete: boolean;
  selectedNutrient: Nutrient | null;
  setSelectedNutrient: (n: Nutrient | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  bookingSubmitted: boolean;
  setBookingSubmitted: (v: boolean) => void;
  lastAssessmentId: string | null;
  isSaving: boolean;
  saveError: string | null;
  submitBooking: (form: BookingForm) => Promise<boolean>;
  pendingSupplementAdd: PendingSupplementAdd | null;
  setPendingSupplementAdd: (data: PendingSupplementAdd | null) => void;
}

export interface BookingForm {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  healthGoals: string;
  currentSupplements: string;
  dietType: string;
}

const AssessmentContext = createContext<AssessmentState | undefined>(undefined);

function generateSessionId(): string {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<DeficiencyResult[]>([]);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [selectedNutrient, setSelectedNutrient] = useState<Nutrient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [lastAssessmentId, setLastAssessmentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const [pendingSupplementAdd, setPendingSupplementAdd] = useState<PendingSupplementAdd | null>(null);

  const setAnswer = useCallback((questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const resetAssessment = useCallback(() => {
    setAnswers({});
    setResults([]);
    setAssessmentComplete(false);
    setLastAssessmentId(null);
    setSaveError(null);
  }, []);

  const calculateResults = useCallback(async () => {
    const nutrientScores: Record<string, { score: number; symptoms: string[]; count: number }> = {};

    allNutrients.forEach(n => {
      nutrientScores[n.id] = { score: 0, symptoms: [], count: 0 };
    });

    const answeredYes = Object.entries(answers).filter(([, v]) => v);

    answeredYes.forEach(([qId]) => {
      const question = allQuestions.find(q => q.id === qId);
      if (!question) return;

      const severityWeight = question.severity === 'high' ? 3 : question.severity === 'medium' ? 2 : 1;

      question.linkedNutrients.forEach(nutrientId => {
        if (nutrientScores[nutrientId]) {
          nutrientScores[nutrientId].score += severityWeight * 15;
          nutrientScores[nutrientId].symptoms.push(question.question);
          nutrientScores[nutrientId].count += 1;
        }
      });
    });

    const deficiencyResults: DeficiencyResult[] = Object.entries(nutrientScores)
      .filter(([, data]) => data.score > 0)
      .map(([nutrientId, data]) => {
        const nutrient = allNutrients.find(n => n.id === nutrientId)!;
        const normalizedScore = Math.min(100, data.score);
        let priority: 'critical' | 'moderate' | 'low';
        if (normalizedScore >= 60) priority = 'critical';
        else if (normalizedScore >= 30) priority = 'moderate';
        else priority = 'low';

        return {
          nutrient,
          score: normalizedScore,
          priority,
          triggeringSymptoms: data.symptoms
        };
      })
      .sort((a, b) => b.score - a.score);

    setResults(deficiencyResults);
    setAssessmentComplete(true);

    // Save to database
    setIsSaving(true);
    setSaveError(null);

    try {
      const deficiencyScoresForDb = deficiencyResults.map(r => ({
        nutrient_id: r.nutrient.id,
        nutrient_name: r.nutrient.name,
        category: r.nutrient.category,
        score: r.score,
        priority: r.priority,
        triggering_symptoms: r.triggeringSymptoms
      }));

      const criticalCount = deficiencyResults.filter(r => r.priority === 'critical').length;
      const moderateCount = deficiencyResults.filter(r => r.priority === 'moderate').length;
      const lowCount = deficiencyResults.filter(r => r.priority === 'low').length;
      const topDeficiencies = deficiencyResults.slice(0, 5).map(r => r.nutrient.name);
      const totalAnswered = Object.keys(answers).length;
      const totalYes = answeredYes.length;

      const { data, error } = await supabase
        .from('assessment_results')
        .insert({
          session_id: sessionId,
          answers: answers,
          deficiency_scores: deficiencyScoresForDb,
          critical_count: criticalCount,
          moderate_count: moderateCount,
          low_count: lowCount,
          total_questions_answered: totalAnswered,
          total_yes_answers: totalYes,
          top_deficiencies: topDeficiencies
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save assessment:', error);
        setSaveError('Results calculated but could not be saved to database.');
      } else if (data) {
        setLastAssessmentId(data.id);
      }
    } catch (err) {
      console.error('Error saving assessment:', err);
      setSaveError('Results calculated but could not be saved to database.');
    } finally {
      setIsSaving(false);
    }
  }, [answers, sessionId]);

  const submitBooking = useCallback(async (form: BookingForm): Promise<boolean> => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const bookingData: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        diet_type: form.dietType,
        health_goals: form.healthGoals,
        current_supplements: form.currentSupplements || null,
        preferred_date: form.preferredDate || null,
        status: 'pending'
      };

      if (lastAssessmentId) {
        bookingData.assessment_id = lastAssessmentId;
      }

      const { error } = await supabase
        .from('booking_requests')
        .insert(bookingData);

      if (error) {
        console.error('Failed to save booking:', error);
        setSaveError('Could not save booking request. Please try again.');
        return false;
      }

      setBookingSubmitted(true);
      return true;
    } catch (err) {
      console.error('Error saving booking:', err);
      setSaveError('Could not save booking request. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [lastAssessmentId]);

  return (
    <AssessmentContext.Provider value={{
      currentView,
      setCurrentView,
      answers,
      setAnswer,
      resetAssessment,
      results,
      calculateResults,
      assessmentComplete,
      selectedNutrient,
      setSelectedNutrient,
      searchQuery,
      setSearchQuery,
      activeCategory,
      setActiveCategory,
      bookingSubmitted,
      setBookingSubmitted,
      lastAssessmentId,
      isSaving,
      saveError,
      submitBooking,
      pendingSupplementAdd,
      setPendingSupplementAdd,
    }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) throw new Error('useAssessment must be used within AssessmentProvider');
  return context;
};
