export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string;
          id: string;
          read_at: string;
          user_id: string;
        };
        Insert: {
          announcement_id: string;
          id?: string;
          read_at?: string;
          user_id?: string;
        };
        Update: {
          announcement_id?: string;
          id?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          body: string;
          category: Database["public"]["Enums"]["announcement_category"];
          church_id: string | null;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          id: string;
          is_pinned: boolean;
          is_published: boolean;
          mesa_id: string | null;
          ministry_id: string | null;
          published_at: string | null;
          rede_id: string | null;
          scope: Database["public"]["Enums"]["announcement_scope"];
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          category?: Database["public"]["Enums"]["announcement_category"];
          church_id?: string | null;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          id?: string;
          is_pinned?: boolean;
          is_published?: boolean;
          mesa_id?: string | null;
          ministry_id?: string | null;
          published_at?: string | null;
          rede_id?: string | null;
          scope?: Database["public"]["Enums"]["announcement_scope"];
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          category?: Database["public"]["Enums"]["announcement_category"];
          church_id?: string | null;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          id?: string;
          is_pinned?: boolean;
          is_published?: boolean;
          mesa_id?: string | null;
          ministry_id?: string | null;
          published_at?: string | null;
          rede_id?: string | null;
          scope?: Database["public"]["Enums"]["announcement_scope"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_mesa_id_fkey";
            columns: ["mesa_id"];
            isOneToOne: false;
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_rede_id_fkey";
            columns: ["rede_id"];
            isOneToOne: false;
            referencedRelation: "redes";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: string | null;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: string | null;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string | null;
        };
        Relationships: [];
      };
      canteen_items: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          price_cents: number;
          updated_at: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          price_cents?: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          price_cents?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      canteen_menu_items: {
        Row: {
          created_at: string;
          id: string;
          is_available: boolean;
          item_id: string;
          menu_id: string;
          price_cents: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_available?: boolean;
          item_id: string;
          menu_id: string;
          price_cents?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_available?: boolean;
          item_id?: string;
          menu_id?: string;
          price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "canteen_menu_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "canteen_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "canteen_menu_items_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "canteen_menus";
            referencedColumns: ["id"];
          },
        ];
      };
      canteen_menus: {
        Row: {
          art_url: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          service_date: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          art_url?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          service_date: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          art_url?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          service_date?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      canteen_reservation_items: {
        Row: {
          created_at: string;
          id: string;
          item_id: string | null;
          item_name: string;
          quantity: number;
          reservation_id: string;
          unit_price_cents: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id?: string | null;
          item_name: string;
          quantity?: number;
          reservation_id: string;
          unit_price_cents?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string | null;
          item_name?: string;
          quantity?: number;
          reservation_id?: string;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "canteen_reservation_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "canteen_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "canteen_reservation_items_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "canteen_reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      canteen_reservations: {
        Row: {
          created_at: string;
          id: string;
          menu_id: string;
          notes: string | null;
          picked_up_at: string | null;
          pickup_code: string;
          status: string;
          total_cents: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          menu_id: string;
          notes?: string | null;
          picked_up_at?: string | null;
          pickup_code?: string;
          status?: string;
          total_cents?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          menu_id?: string;
          notes?: string | null;
          picked_up_at?: string | null;
          pickup_code?: string;
          status?: string;
          total_cents?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "canteen_reservations_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "canteen_menus";
            referencedColumns: ["id"];
          },
        ];
      };
      churches: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          is_headquarters: boolean;
          lead_pastor: string | null;
          name: string;
          neighborhood: string | null;
          notes: string | null;
          phone: string | null;
          pix_city: string | null;
          pix_key: string | null;
          pix_name: string | null;
          short_name: string | null;
          state: string | null;
          street_number: string | null;
          updated_at: string;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_headquarters?: boolean;
          lead_pastor?: string | null;
          name: string;
          neighborhood?: string | null;
          notes?: string | null;
          phone?: string | null;
          pix_city?: string | null;
          pix_key?: string | null;
          pix_name?: string | null;
          short_name?: string | null;
          state?: string | null;
          street_number?: string | null;
          updated_at?: string;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_headquarters?: boolean;
          lead_pastor?: string | null;
          name?: string;
          neighborhood?: string | null;
          notes?: string | null;
          phone?: string | null;
          pix_city?: string | null;
          pix_key?: string | null;
          pix_name?: string | null;
          short_name?: string | null;
          state?: string | null;
          street_number?: string | null;
          updated_at?: string;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      cleaning_photos: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          schedule_id: string | null;
          task_id: string | null;
          type: string;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          schedule_id?: string | null;
          task_id?: string | null;
          type: string;
          url: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          schedule_id?: string | null;
          task_id?: string | null;
          type?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cleaning_photos_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "cleaning_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cleaning_photos_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "cleaning_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      cleaning_schedules: {
        Row: {
          created_at: string | null;
          date: string;
          id: string;
          mesa_id: string | null;
          notes: string | null;
          responsible_id: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          id?: string;
          mesa_id?: string | null;
          notes?: string | null;
          responsible_id?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          id?: string;
          mesa_id?: string | null;
          notes?: string | null;
          responsible_id?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cleaning_schedules_mesa_id_fkey";
            columns: ["mesa_id"];
            isOneToOne: false;
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          },
        ];
      };
      cleaning_tasks: {
        Row: {
          completed_at: string | null;
          completed_by: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_completed: boolean | null;
          schedule_id: string | null;
          title: string;
        };
        Insert: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_completed?: boolean | null;
          schedule_id?: string | null;
          title: string;
        };
        Update: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_completed?: boolean | null;
          schedule_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cleaning_tasks_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "cleaning_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      event_rsvps: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          note: string | null;
          status: Database["public"]["Enums"]["rsvp_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          note?: string | null;
          status?: Database["public"]["Enums"]["rsvp_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          note?: string | null;
          status?: Database["public"]["Enums"]["rsvp_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          capacity: number | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          image_url: string | null;
          is_featured: boolean;
          kind: Database["public"]["Enums"]["event_kind"];
          location: string | null;
          mesa_address_id: string | null;
          mesa_id: string | null;
          ministry_id: string | null;
          rede_id: string | null;
          requires_rsvp: boolean;
          scope: Database["public"]["Enums"]["event_scope"];
          starts_at: string;
          status: Database["public"]["Enums"]["event_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          kind?: Database["public"]["Enums"]["event_kind"];
          location?: string | null;
          mesa_address_id?: string | null;
          mesa_id?: string | null;
          ministry_id?: string | null;
          rede_id?: string | null;
          requires_rsvp?: boolean;
          scope?: Database["public"]["Enums"]["event_scope"];
          starts_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          capacity?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          kind?: Database["public"]["Enums"]["event_kind"];
          location?: string | null;
          mesa_address_id?: string | null;
          mesa_id?: string | null;
          ministry_id?: string | null;
          rede_id?: string | null;
          requires_rsvp?: boolean;
          scope?: Database["public"]["Enums"]["event_scope"];
          starts_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_mesa_address_id_fkey";
            columns: ["mesa_address_id"];
            isOneToOne: false;
            referencedRelation: "mesa_addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_mesa_id_fkey";
            columns: ["mesa_id"];
            isOneToOne: false;
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_rede_id_fkey";
            columns: ["rede_id"];
            isOneToOne: false;
            referencedRelation: "redes";
            referencedColumns: ["id"];
          },
        ];
      };
      family_links: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          person_id: string;
          relation: Database["public"]["Enums"]["family_relation"];
          relative_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          person_id: string;
          relation: Database["public"]["Enums"]["family_relation"];
          relative_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          person_id?: string;
          relation?: Database["public"]["Enums"]["family_relation"];
          relative_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_links_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_links_relative_id_fkey";
            columns: ["relative_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_checkins: {
        Row: {
          checked_in_at: string;
          checked_in_by: string | null;
          checked_out_at: string | null;
          checked_out_by: string | null;
          child_id: string;
          created_at: string;
          day_notes: string | null;
          dropped_by_name: string | null;
          id: string;
          picked_up_by_name: string | null;
          security_code: string;
          session_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          checked_in_at?: string;
          checked_in_by?: string | null;
          checked_out_at?: string | null;
          checked_out_by?: string | null;
          child_id: string;
          created_at?: string;
          day_notes?: string | null;
          dropped_by_name?: string | null;
          id?: string;
          picked_up_by_name?: string | null;
          security_code: string;
          session_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          checked_in_at?: string;
          checked_in_by?: string | null;
          checked_out_at?: string | null;
          checked_out_by?: string | null;
          child_id?: string;
          created_at?: string;
          day_notes?: string | null;
          dropped_by_name?: string | null;
          id?: string;
          picked_up_by_name?: string | null;
          security_code?: string;
          session_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kids_checkins_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "kids_children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kids_checkins_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "kids_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_children: {
        Row: {
          allergies: string | null;
          birth_date: string | null;
          can_leave_alone: boolean;
          church_id: string | null;
          classroom: string;
          created_at: string;
          created_by: string | null;
          full_name: string;
          gender: string | null;
          health_notes: string | null;
          id: string;
          is_active: boolean;
          nickname: string | null;
          notes: string | null;
          photo_consent: boolean;
          photo_url: string | null;
          special_needs: string | null;
          updated_at: string;
        };
        Insert: {
          allergies?: string | null;
          birth_date?: string | null;
          can_leave_alone?: boolean;
          church_id?: string | null;
          classroom?: string;
          created_at?: string;
          created_by?: string | null;
          full_name: string;
          gender?: string | null;
          health_notes?: string | null;
          id?: string;
          is_active?: boolean;
          nickname?: string | null;
          notes?: string | null;
          photo_consent?: boolean;
          photo_url?: string | null;
          special_needs?: string | null;
          updated_at?: string;
        };
        Update: {
          allergies?: string | null;
          birth_date?: string | null;
          can_leave_alone?: boolean;
          church_id?: string | null;
          classroom?: string;
          created_at?: string;
          created_by?: string | null;
          full_name?: string;
          gender?: string | null;
          health_notes?: string | null;
          id?: string;
          is_active?: boolean;
          nickname?: string | null;
          notes?: string | null;
          photo_consent?: boolean;
          photo_url?: string | null;
          special_needs?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kids_children_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_emergency_alerts: {
        Row: {
          acknowledged_by_guardian_id: string | null;
          child_id: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          guardian_id: string | null;
          id: string;
          message: string;
          session_id: string | null;
          severity: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          acknowledged_by_guardian_id?: string | null;
          child_id?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          guardian_id?: string | null;
          id?: string;
          message: string;
          session_id?: string | null;
          severity?: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          acknowledged_by_guardian_id?: string | null;
          child_id?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          guardian_id?: string | null;
          id?: string;
          message?: string;
          session_id?: string | null;
          severity?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kids_emergency_alerts_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "kids_children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kids_emergency_alerts_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "kids_guardians";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kids_emergency_alerts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "kids_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_guardians: {
        Row: {
          can_pickup: boolean;
          child_id: string;
          created_at: string;
          document: string | null;
          full_name: string;
          id: string;
          is_primary: boolean;
          notes: string | null;
          phone: string | null;
          photo_url: string | null;
          profile_id: string | null;
          relation: string;
          updated_at: string;
        };
        Insert: {
          can_pickup?: boolean;
          child_id: string;
          created_at?: string;
          document?: string | null;
          full_name: string;
          id?: string;
          is_primary?: boolean;
          notes?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          profile_id?: string | null;
          relation?: string;
          updated_at?: string;
        };
        Update: {
          can_pickup?: boolean;
          child_id?: string;
          created_at?: string;
          document?: string | null;
          full_name?: string;
          id?: string;
          is_primary?: boolean;
          notes?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          profile_id?: string | null;
          relation?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kids_guardians_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "kids_children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kids_guardians_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_schedule_volunteers: {
        Row: {
          created_at: string | null;
          id: string;
          role: string;
          schedule_id: string | null;
          status: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role: string;
          schedule_id?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role?: string;
          schedule_id?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kids_schedule_volunteers_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "kids_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_schedules: {
        Row: {
          church_id: string | null;
          created_at: string | null;
          description: string | null;
          end_time: string | null;
          event_date: string;
          id: string;
          session_id: string | null;
          start_time: string;
          status: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          church_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_time?: string | null;
          event_date: string;
          id?: string;
          session_id?: string | null;
          start_time: string;
          status?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          church_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_time?: string | null;
          event_date?: string;
          id?: string;
          session_id?: string | null;
          start_time?: string;
          status?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kids_schedules_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kids_schedules_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "kids_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_sessions: {
        Row: {
          church_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          room: string | null;
          session_date: string;
          start_time: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          church_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          room?: string | null;
          session_date: string;
          start_time?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          church_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          room?: string | null;
          session_date?: string;
          start_time?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kids_sessions_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_visitor_requests: {
        Row: {
          allergies: string | null;
          birth_date: string | null;
          child_full_name: string;
          child_id: string | null;
          child_nickname: string | null;
          church_id: string | null;
          classroom: string;
          created_at: string;
          document_url: string | null;
          gender: string | null;
          guardian_document: string | null;
          guardian_full_name: string;
          guardian_phone: string;
          guardian_relation: string;
          health_notes: string | null;
          id: string;
          notes: string | null;
          other_pickup: string | null;
          photo_consent: boolean;
          reviewed_at: string | null;
          reviewed_by: string | null;
          special_needs: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          allergies?: string | null;
          birth_date?: string | null;
          child_full_name: string;
          child_id?: string | null;
          child_nickname?: string | null;
          church_id?: string | null;
          classroom?: string;
          created_at?: string;
          document_url?: string | null;
          gender?: string | null;
          guardian_document?: string | null;
          guardian_full_name: string;
          guardian_phone: string;
          guardian_relation?: string;
          health_notes?: string | null;
          id?: string;
          notes?: string | null;
          other_pickup?: string | null;
          photo_consent?: boolean;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          special_needs?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          allergies?: string | null;
          birth_date?: string | null;
          child_full_name?: string;
          child_id?: string | null;
          child_nickname?: string | null;
          church_id?: string | null;
          classroom?: string;
          created_at?: string;
          document_url?: string | null;
          gender?: string | null;
          guardian_document?: string | null;
          guardian_full_name?: string;
          guardian_phone?: string;
          guardian_relation?: string;
          health_notes?: string | null;
          id?: string;
          notes?: string | null;
          other_pickup?: string | null;
          photo_consent?: boolean;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          special_needs?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kids_visitor_requests_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "kids_children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kids_visitor_requests_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          city: string | null;
          created_at: string | null;
          id: string;
          name: string;
          neighborhood: string | null;
          phone: string;
          profile: string;
          state: string | null;
          status: string | null;
          suggested_mesa: string | null;
        };
        Insert: {
          city?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          neighborhood?: string | null;
          phone: string;
          profile: string;
          state?: string | null;
          status?: string | null;
          suggested_mesa?: string | null;
        };
        Update: {
          city?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          neighborhood?: string | null;
          phone?: string;
          profile?: string;
          state?: string | null;
          status?: string | null;
          suggested_mesa?: string | null;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          category: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          file_url: string;
          id: string;
          thumbnail_url: string | null;
          title: string;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          file_url: string;
          id?: string;
          thumbnail_url?: string | null;
          title: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          file_url?: string;
          id?: string;
          thumbnail_url?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      media_requests: {
        Row: {
          created_at: string | null;
          deadline: string | null;
          description: string;
          id: string;
          requester_id: string;
          status: string;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          deadline?: string | null;
          description: string;
          id?: string;
          requester_id: string;
          status?: string;
          title: string;
        };
        Update: {
          created_at?: string | null;
          deadline?: string | null;
          description?: string;
          id?: string;
          requester_id?: string;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      member_onboarding_steps: {
        Row: {
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          person_id: string;
          step_id: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          person_id: string;
          step_id: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          person_id?: string;
          step_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_onboarding_steps_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_onboarding_steps_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_steps";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_requests: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          notes: string | null;
          phone: string | null;
          profile_id: string | null;
          requested_by: string | null;
          requester_name: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          profile_id?: string | null;
          requested_by?: string | null;
          requester_name?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          profile_id?: string | null;
          requested_by?: string | null;
          requester_name?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mesa_addresses: {
        Row: {
          city: string | null;
          complement: string | null;
          created_at: string;
          full_address: string;
          id: string;
          is_main: boolean | null;
          label: string;
          mesa_id: string;
          neighborhood: string | null;
          number: string;
          postal_code: string | null;
          state: string | null;
          street: string;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          complement?: string | null;
          created_at?: string;
          full_address: string;
          id?: string;
          is_main?: boolean | null;
          label?: string;
          mesa_id: string;
          neighborhood?: string | null;
          number: string;
          postal_code?: string | null;
          state?: string | null;
          street: string;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          complement?: string | null;
          created_at?: string;
          full_address?: string;
          id?: string;
          is_main?: boolean | null;
          label?: string;
          mesa_id?: string;
          neighborhood?: string | null;
          number?: string;
          postal_code?: string | null;
          state?: string | null;
          street?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mesa_addresses_mesa_id_fkey";
            columns: ["mesa_id"];
            isOneToOne: false;
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          },
        ];
      };
      mesa_members: {
        Row: {
          id: string;
          joined_at: string;
          mesa_id: string;
          role: Database["public"]["Enums"]["church_function"];
          user_id: string;
        };
        Insert: {
          id?: string;
          joined_at?: string;
          mesa_id: string;
          role?: Database["public"]["Enums"]["church_function"];
          user_id: string;
        };
        Update: {
          id?: string;
          joined_at?: string;
          mesa_id?: string;
          role?: Database["public"]["Enums"]["church_function"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mesa_members_mesa_id_fkey";
            columns: ["mesa_id"];
            isOneToOne: false;
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mesa_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mesas: {
        Row: {
          church_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          meeting_day: string | null;
          meeting_location: string | null;
          meeting_time: string | null;
          name: string;
          photo_url: string | null;
          rede_id: string | null;
          updated_at: string;
        };
        Insert: {
          church_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          meeting_day?: string | null;
          meeting_location?: string | null;
          meeting_time?: string | null;
          name: string;
          photo_url?: string | null;
          rede_id?: string | null;
          updated_at?: string;
        };
        Update: {
          church_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          meeting_day?: string | null;
          meeting_location?: string | null;
          meeting_time?: string | null;
          name?: string;
          photo_url?: string | null;
          rede_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mesas_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mesas_rede_id_fkey";
            columns: ["rede_id"];
            isOneToOne: false;
            referencedRelation: "redes";
            referencedColumns: ["id"];
          },
        ];
      };
      ministries: {
        Row: {
          church_id: string | null;
          color: string | null;
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean;
          meeting_info: string | null;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          church_id?: string | null;
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          meeting_info?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          church_id?: string | null;
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          meeting_info?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ministries_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      ministry_members: {
        Row: {
          function_name: string | null;
          id: string;
          joined_at: string;
          ministry_id: string;
          user_id: string;
        };
        Insert: {
          function_name?: string | null;
          id?: string;
          joined_at?: string;
          ministry_id: string;
          user_id: string;
        };
        Update: {
          function_name?: string | null;
          id?: string;
          joined_at?: string;
          ministry_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ministry_members_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
        ];
      };
      news: {
        Row: {
          author_id: string | null;
          category: string | null;
          content: string;
          created_at: string | null;
          excerpt: string | null;
          id: string;
          image_url: string | null;
          is_featured: boolean | null;
          is_published: boolean | null;
          published_at: string | null;
          slug: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          author_id?: string | null;
          category?: string | null;
          content: string;
          created_at?: string | null;
          excerpt?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean | null;
          is_published?: boolean | null;
          published_at?: string | null;
          slug: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string | null;
          category?: string | null;
          content?: string;
          created_at?: string | null;
          excerpt?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean | null;
          is_published?: boolean | null;
          published_at?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notifications_history: {
        Row: {
          body: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          status: string | null;
          title: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          status?: string | null;
          title: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          status?: string | null;
          title?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      onboarding_steps: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          position: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          position?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          position?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price_cents: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity?: number;
          unit_price_cents?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          delivered_at: string | null;
          id: string;
          notes: string | null;
          payment_proof_url: string | null;
          pickup_code: string;
          status: string;
          total_cents: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          id?: string;
          notes?: string | null;
          payment_proof_url?: string | null;
          pickup_code?: string;
          status?: string;
          total_cents?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          id?: string;
          notes?: string | null;
          payment_proof_url?: string | null;
          pickup_code?: string;
          status?: string;
          total_cents?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      pastoral_notes: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          happened_on: string;
          id: string;
          kind: string;
          person_id: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          happened_on?: string;
          id?: string;
          kind?: string;
          person_id: string;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          happened_on?: string;
          id?: string;
          kind?: string;
          person_id?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pastoral_notes_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      prayer_requests: {
        Row: {
          category: string;
          content: string;
          created_at: string;
          id: string;
          is_private: boolean | null;
          mesa_id: string | null;
          responded_at: string | null;
          response: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category: string;
          content: string;
          created_at?: string;
          id?: string;
          is_private?: boolean | null;
          mesa_id?: string | null;
          responded_at?: string | null;
          response?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          content?: string;
          created_at?: string;
          id?: string;
          is_private?: boolean | null;
          mesa_id?: string | null;
          responded_at?: string | null;
          response?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prayer_requests_mesa_id_fkey";
            columns: ["mesa_id"];
            isOneToOne: false;
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          price_cents: number;
          stock: number;
          track_stock: boolean;
          updated_at: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          price_cents?: number;
          stock?: number;
          track_stock?: boolean;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          price_cents?: number;
          stock?: number;
          track_stock?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          allergies: string | null;
          availability: string | null;
          avatar_url: string | null;
          baptism_church: string | null;
          baptism_date: string | null;
          bio: string | null;
          birth_date: string | null;
          blood_type: string | null;
          children_count: number;
          church_function: Database["public"]["Enums"]["church_function"];
          church_id: string | null;
          city: string | null;
          complement: string | null;
          conversion_date: string | null;
          courses: string[];
          cpf: string | null;
          created_at: string;
          education: string | null;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: string | null;
          father_name: string | null;
          full_name: string;
          gender: string | null;
          gifts: string | null;
          has_children: boolean;
          health_notes: string | null;
          id: string;
          is_baptized: boolean | null;
          marital_status: string | null;
          member_since: string | null;
          membership_end_date: string | null;
          membership_status: string;
          membership_type: string | null;
          ministerial_status: Database["public"]["Enums"]["ministerial_status"] | null;
          mother_name: string | null;
          neighborhood: string | null;
          notes: string | null;
          phone: string | null;
          previous_church: string | null;
          profession: string | null;
          rg: string | null;
          spouse_name: string | null;
          state: string | null;
          street: string | null;
          street_number: string | null;
          updated_at: string;
          wedding_date: string | null;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          allergies?: string | null;
          availability?: string | null;
          avatar_url?: string | null;
          baptism_church?: string | null;
          baptism_date?: string | null;
          bio?: string | null;
          birth_date?: string | null;
          blood_type?: string | null;
          children_count?: number;
          church_function?: Database["public"]["Enums"]["church_function"];
          church_id?: string | null;
          city?: string | null;
          complement?: string | null;
          conversion_date?: string | null;
          courses?: string[];
          cpf?: string | null;
          created_at?: string;
          education?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          father_name?: string | null;
          full_name: string;
          gender?: string | null;
          gifts?: string | null;
          has_children?: boolean;
          health_notes?: string | null;
          id?: string;
          is_baptized?: boolean | null;
          marital_status?: string | null;
          member_since?: string | null;
          membership_end_date?: string | null;
          membership_status?: string;
          membership_type?: string | null;
          ministerial_status?: Database["public"]["Enums"]["ministerial_status"] | null;
          mother_name?: string | null;
          neighborhood?: string | null;
          notes?: string | null;
          phone?: string | null;
          previous_church?: string | null;
          profession?: string | null;
          rg?: string | null;
          spouse_name?: string | null;
          state?: string | null;
          street?: string | null;
          street_number?: string | null;
          updated_at?: string;
          wedding_date?: string | null;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          allergies?: string | null;
          availability?: string | null;
          avatar_url?: string | null;
          baptism_church?: string | null;
          baptism_date?: string | null;
          bio?: string | null;
          birth_date?: string | null;
          blood_type?: string | null;
          children_count?: number;
          church_function?: Database["public"]["Enums"]["church_function"];
          church_id?: string | null;
          city?: string | null;
          complement?: string | null;
          conversion_date?: string | null;
          courses?: string[];
          cpf?: string | null;
          created_at?: string;
          education?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          father_name?: string | null;
          full_name?: string;
          gender?: string | null;
          gifts?: string | null;
          has_children?: boolean;
          health_notes?: string | null;
          id?: string;
          is_baptized?: boolean | null;
          marital_status?: string | null;
          member_since?: string | null;
          membership_end_date?: string | null;
          membership_status?: string;
          membership_type?: string | null;
          ministerial_status?: Database["public"]["Enums"]["ministerial_status"] | null;
          mother_name?: string | null;
          neighborhood?: string | null;
          notes?: string | null;
          phone?: string | null;
          previous_church?: string | null;
          profession?: string | null;
          rg?: string | null;
          spouse_name?: string | null;
          state?: string | null;
          street?: string | null;
          street_number?: string | null;
          updated_at?: string;
          wedding_date?: string | null;
          zip_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      rede_members: {
        Row: {
          created_at: string;
          id: string;
          rede_id: string;
          role: Database["public"]["Enums"]["church_function"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          rede_id: string;
          role?: Database["public"]["Enums"]["church_function"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          rede_id?: string;
          role?: Database["public"]["Enums"]["church_function"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rede_members_rede_id_fkey";
            columns: ["rede_id"];
            isOneToOne: false;
            referencedRelation: "redes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rede_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      redes: {
        Row: {
          church_id: string | null;
          color: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          target_audience: string | null;
          updated_at: string;
        };
        Insert: {
          church_id?: string | null;
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          target_audience?: string | null;
          updated_at?: string;
        };
        Update: {
          church_id?: string | null;
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          target_audience?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "redes_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      setlist_songs: {
        Row: {
          created_at: string | null;
          id: string;
          key_override: string | null;
          notes: string | null;
          position: number;
          setlist_id: string;
          song_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          key_override?: string | null;
          notes?: string | null;
          position: number;
          setlist_id: string;
          song_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          key_override?: string | null;
          notes?: string | null;
          position?: number;
          setlist_id?: string;
          song_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "setlist_songs_setlist_id_fkey";
            columns: ["setlist_id"];
            isOneToOne: false;
            referencedRelation: "setlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "setlist_songs_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      setlists: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          event_date: string;
          id: string;
          ministry_id: string | null;
          notes: string | null;
          status: string;
          title: string;
          updated_at: string | null;
          worship_schedule_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          event_date: string;
          id?: string;
          ministry_id?: string | null;
          notes?: string | null;
          status?: string;
          title: string;
          updated_at?: string | null;
          worship_schedule_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          event_date?: string;
          id?: string;
          ministry_id?: string | null;
          notes?: string | null;
          status?: string;
          title?: string;
          updated_at?: string | null;
          worship_schedule_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "setlists_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "setlists_worship_schedule_id_fkey";
            columns: ["worship_schedule_id"];
            isOneToOne: false;
            referencedRelation: "worship_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      social_assistance_campaigns: {
        Row: {
          created_at: string | null;
          description: string;
          goal_current: number | null;
          goal_target: number | null;
          goal_type: string;
          id: string;
          status: string;
          title: string;
          total_families_reached: number | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          goal_current?: number | null;
          goal_target?: number | null;
          goal_type: string;
          id?: string;
          status?: string;
          title: string;
          total_families_reached?: number | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          goal_current?: number | null;
          goal_target?: number | null;
          goal_type?: string;
          id?: string;
          status?: string;
          title?: string;
          total_families_reached?: number | null;
        };
        Relationships: [];
      };
      social_assistance_requests: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          needs_food: boolean | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          needs_food?: boolean | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          needs_food?: boolean | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      social_assistance_requests_legacy: {
        Row: {
          created_at: string | null;
          family_members_count: number | null;
          handled_by: string | null;
          id: string;
          needs_description: string;
          notes: string | null;
          requester_name: string;
          requester_phone: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          family_members_count?: number | null;
          handled_by?: string | null;
          id?: string;
          needs_description: string;
          notes?: string | null;
          requester_name: string;
          requester_phone?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          family_members_count?: number | null;
          handled_by?: string | null;
          id?: string;
          needs_description?: string;
          notes?: string | null;
          requester_name?: string;
          requester_phone?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      songs: {
        Row: {
          artist: string | null;
          bpm: number | null;
          chords_url: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          id: string;
          is_active: boolean | null;
          lyrics: string | null;
          notes: string | null;
          original_key: string | null;
          spotify_url: string | null;
          title: string;
          updated_at: string | null;
          youtube_url: string | null;
        };
        Insert: {
          artist?: string | null;
          bpm?: number | null;
          chords_url?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          is_active?: boolean | null;
          lyrics?: string | null;
          notes?: string | null;
          original_key?: string | null;
          spotify_url?: string | null;
          title: string;
          updated_at?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          artist?: string | null;
          bpm?: number | null;
          chords_url?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          is_active?: boolean | null;
          lyrics?: string | null;
          notes?: string | null;
          original_key?: string | null;
          spotify_url?: string | null;
          title?: string;
          updated_at?: string | null;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      user_push_tokens: {
        Row: {
          created_at: string | null;
          device_type: string | null;
          id: string;
          token: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          device_type?: string | null;
          id?: string;
          token: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          device_type?: string | null;
          id?: string;
          token?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          mesa_id: string | null;
          ministry_id: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          mesa_id?: string | null;
          ministry_id?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          mesa_id?: string | null;
          ministry_id?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      visitor_checkins: {
        Row: {
          created_at: string | null;
          full_name: string;
          id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          whatsapp: string;
        };
        Insert: {
          created_at?: string | null;
          full_name: string;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          whatsapp: string;
        };
        Update: {
          created_at?: string | null;
          full_name?: string;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          whatsapp?: string;
        };
        Relationships: [];
      };
      worship_musicians: {
        Row: {
          created_at: string;
          functions: string[];
          id: string;
          is_active: boolean;
          ministry_id: string;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          functions?: string[];
          id?: string;
          is_active?: boolean;
          ministry_id?: string;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          functions?: string[];
          id?: string;
          is_active?: boolean;
          ministry_id?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worship_musicians_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worship_musicians_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      worship_schedule_assignments: {
        Row: {
          created_at: string;
          function_name: string;
          id: string;
          responded_at: string | null;
          response_note: string | null;
          schedule_id: string;
          status: Database["public"]["Enums"]["worship_assignment_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          function_name: string;
          id?: string;
          responded_at?: string | null;
          response_note?: string | null;
          schedule_id: string;
          status?: Database["public"]["Enums"]["worship_assignment_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          function_name?: string;
          id?: string;
          responded_at?: string | null;
          response_note?: string | null;
          schedule_id?: string;
          status?: Database["public"]["Enums"]["worship_assignment_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worship_schedule_assignments_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "worship_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worship_schedule_assignments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      worship_schedules: {
        Row: {
          created_at: string;
          created_by: string | null;
          event_date: string;
          id: string;
          location: string | null;
          ministry_id: string;
          notes: string | null;
          schedule_type: Database["public"]["Enums"]["worship_schedule_type"];
          start_time: string | null;
          status: Database["public"]["Enums"]["worship_schedule_status"];
          team_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          event_date: string;
          id?: string;
          location?: string | null;
          ministry_id?: string;
          notes?: string | null;
          schedule_type?: Database["public"]["Enums"]["worship_schedule_type"];
          start_time?: string | null;
          status?: Database["public"]["Enums"]["worship_schedule_status"];
          team_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          event_date?: string;
          id?: string;
          location?: string | null;
          ministry_id?: string;
          notes?: string | null;
          schedule_type?: Database["public"]["Enums"]["worship_schedule_type"];
          start_time?: string | null;
          status?: Database["public"]["Enums"]["worship_schedule_status"];
          team_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worship_schedules_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worship_schedules_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "worship_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      worship_setlist_items: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          position: number;
          schedule_id: string;
          song_id: string;
          song_key: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          schedule_id: string;
          song_id: string;
          song_key?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          schedule_id?: string;
          song_id?: string;
          song_key?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "worship_setlist_items_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "worship_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worship_setlist_items_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "worship_songs";
            referencedColumns: ["id"];
          },
        ];
      };
      worship_songs: {
        Row: {
          artist: string | null;
          bpm: number | null;
          chords: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          lyrics: string | null;
          ministry_id: string;
          notes: string | null;
          sheet_url: string | null;
          song_key: string | null;
          tags: string[];
          tempo: string | null;
          theme: string | null;
          title: string;
          updated_at: string;
          youtube_url: string | null;
        };
        Insert: {
          artist?: string | null;
          bpm?: number | null;
          chords?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          lyrics?: string | null;
          ministry_id?: string;
          notes?: string | null;
          sheet_url?: string | null;
          song_key?: string | null;
          tags?: string[];
          tempo?: string | null;
          theme?: string | null;
          title: string;
          updated_at?: string;
          youtube_url?: string | null;
        };
        Update: {
          artist?: string | null;
          bpm?: number | null;
          chords?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          lyrics?: string | null;
          ministry_id?: string;
          notes?: string | null;
          sheet_url?: string | null;
          song_key?: string | null;
          tags?: string[];
          tempo?: string | null;
          theme?: string | null;
          title?: string;
          updated_at?: string;
          youtube_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "worship_songs_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
        ];
      };
      worship_team_members: {
        Row: {
          created_at: string;
          function_name: string;
          id: string;
          instruments: string[];
          is_titular: boolean;
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          function_name: string;
          id?: string;
          instruments?: string[];
          is_titular?: boolean;
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          function_name?: string;
          id?: string;
          instruments?: string[];
          is_titular?: boolean;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worship_team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "worship_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worship_team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      worship_teams: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          minister_id: string | null;
          ministry_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          minister_id?: string | null;
          ministry_id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          minister_id?: string | null;
          ministry_id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worship_teams_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
        ];
      };
      youtube_videos: {
        Row: {
          created_at: string | null;
          id: string;
          published_at: string | null;
          thumbnail_url: string | null;
          title: string;
          type: string;
          url: string;
          youtube_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          published_at?: string | null;
          thumbnail_url?: string | null;
          title: string;
          type: string;
          url: string;
          youtube_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          published_at?: string | null;
          thumbnail_url?: string | null;
          title?: string;
          type?: string;
          url?: string;
          youtube_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_manage_announcement: {
        Args: {
          _mesa_id: string;
          _ministry_id: string;
          _scope: Database["public"]["Enums"]["announcement_scope"];
          _user_id: string;
        };
        Returns: boolean;
      };
      can_view_announcement: {
        Args: {
          _church_id: string;
          _mesa_id: string;
          _ministry_id: string;
          _rede_id: string;
          _scope: Database["public"]["Enums"]["announcement_scope"];
          _user_id: string;
        };
        Returns: boolean;
      };
      can_view_mesa: {
        Args: { _mesa_id: string; _user_id: string };
        Returns: boolean;
      };
      can_view_rede: {
        Args: { _rede_id: string; _user_id: string };
        Returns: boolean;
      };
      claim_first_admin: { Args: { _user_id: string }; Returns: boolean };
      gen_pickup_code: { Args: { _prefix: string }; Returns: string };
      has_mesa_role: {
        Args: { _mesa_id: string; _user_id: string };
        Returns: boolean;
      };
      has_ministry_role: {
        Args: { _ministry_id: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      inverse_family_relation: {
        Args: {
          _person_gender: string;
          _relation: Database["public"]["Enums"]["family_relation"];
        };
        Returns: Database["public"]["Enums"]["family_relation"];
      };
      is_cantina_admin: { Args: { _user_id: string }; Returns: boolean };
      is_guardian_of: {
        Args: { _child_id: string; _user_id: string };
        Returns: boolean;
      };
      is_kids_admin: { Args: { _user_id: string }; Returns: boolean };
      is_leadership: { Args: { _user_id: string }; Returns: boolean };
      is_livraria_admin: { Args: { _user_id: string }; Returns: boolean };
      is_mesa_member: {
        Args: { _mesa_id: string; _user_id: string };
        Returns: boolean;
      };
      is_pastoral: { Args: { _user_id: string }; Returns: boolean };
      is_rede_member: {
        Args: { _rede_id: string; _user_id: string };
        Returns: boolean;
      };
      kids_find_family_by_phone: {
        Args: { _phone: string };
        Returns: {
          child_id: string;
          first_name: string;
        }[];
      };
      notify_cleaning_responsible: { Args: never; Returns: undefined };
      register_public_visitor: {
        Args: { _full_name: string; _whatsapp: string };
        Returns: Json;
      };
    };
    Enums: {
      announcement_category: "aviso" | "comunicado" | "urgente" | "acao";
      announcement_scope: "geral" | "igreja" | "ministerio" | "rede" | "mesa";
      app_role:
        | "admin_geral"
        | "admin_ministerio"
        | "lider_mesa"
        | "membro"
        | "admin_livraria"
        | "admin_cantina"
        | "admin_kids";
      church_function:
        | "pastor"
        | "apascentador"
        | "lider"
        | "diacono"
        | "obreiro"
        | "membro"
        | "lider_mesa"
        | "lider_rede"
        | "lider_ministerio";
      event_kind: "culto" | "ensaio" | "reuniao" | "evento" | "acao_social" | "treinamento";
      event_scope: "igreja" | "ministerio" | "rede" | "mesa";
      event_status: "rascunho" | "publicado" | "cancelado" | "concluido";
      family_relation: "conjuge" | "filho" | "pai" | "mae" | "irmao" | "avo" | "neto" | "outro";
      ministerial_status: "membro" | "lider" | "apasc" | "pra" | "pr";
      rsvp_status: "vou" | "nao_vou" | "talvez";
      worship_assignment_status: "pendente" | "confirmado" | "recusado";
      worship_schedule_status: "rascunho" | "publicada" | "concluida";
      worship_schedule_type: "culto" | "ensaio" | "evento";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      announcement_category: ["aviso", "comunicado", "urgente", "acao"],
      announcement_scope: ["geral", "igreja", "ministerio", "rede", "mesa"],
      app_role: [
        "admin_geral",
        "admin_ministerio",
        "lider_mesa",
        "membro",
        "admin_livraria",
        "admin_cantina",
        "admin_kids",
      ],
      church_function: [
        "pastor",
        "apascentador",
        "lider",
        "diacono",
        "obreiro",
        "membro",
        "lider_mesa",
        "lider_rede",
        "lider_ministerio",
      ],
      event_kind: ["culto", "ensaio", "reuniao", "evento", "acao_social", "treinamento"],
      event_scope: ["igreja", "ministerio", "rede", "mesa"],
      event_status: ["rascunho", "publicado", "cancelado", "concluido"],
      family_relation: ["conjuge", "filho", "pai", "mae", "irmao", "avo", "neto", "outro"],
      ministerial_status: ["membro", "lider", "apasc", "pra", "pr"],
      rsvp_status: ["vou", "nao_vou", "talvez"],
      worship_assignment_status: ["pendente", "confirmado", "recusado"],
      worship_schedule_status: ["rascunho", "publicada", "concluida"],
      worship_schedule_type: ["culto", "ensaio", "evento"],
    },
  },
} as const;
