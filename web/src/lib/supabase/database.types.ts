
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "addresses": {
                  Row: {
                    "created_at": string,"id": string,"il": string,"ilce": string,"is_default": boolean,"line": string,"phone": string | null,"profile_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"il": string,"ilce": string,"is_default"?: boolean,"line": string,"phone"?: string | null,"profile_id": string,"title"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"il"?: string,"ilce"?: string,"is_default"?: boolean,"line"?: string,"phone"?: string | null,"profile_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "addresses_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"appointment_slots": {
                  Row: {
                    "held_by": string | null,"held_until": string | null,"id": string,"slot_end": string,"slot_start": string,"status": Database["public"]['Enums']["slot_status"],"technician_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "held_by"?: string | null,"held_until"?: string | null,"id"?: string,"slot_end": string,"slot_start": string,"status"?: Database["public"]['Enums']["slot_status"],"technician_id": string
                  }
                  Update: {
                    "held_by"?: string | null,"held_until"?: string | null,"id"?: string,"slot_end"?: string,"slot_start"?: string,"status"?: Database["public"]['Enums']["slot_status"],"technician_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointment_slots_held_by_fkey"
      columns: ["held_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointment_slots_technician_id_fkey"
      columns: ["technician_id"]
isOneToOne: false
      referencedRelation: "technicians"
      referencedColumns: ["id"]
    }
                  ]
                },"appointments": {
                  Row: {
                    "created_at": string,"id": string,"installation_id": string | null,"order_id": string | null,"profile_id": string,"slot_id": string | null,"slot_start": string,"status": Database["public"]['Enums']["appointment_status"],"technician_id": string,"type": Database["public"]['Enums']["appointment_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"installation_id"?: string | null,"order_id"?: string | null,"profile_id": string,"slot_id"?: string | null,"slot_start": string,"status"?: Database["public"]['Enums']["appointment_status"],"technician_id": string,"type"?: Database["public"]['Enums']["appointment_type"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"installation_id"?: string | null,"order_id"?: string | null,"profile_id"?: string,"slot_id"?: string | null,"slot_start"?: string,"status"?: Database["public"]['Enums']["appointment_status"],"technician_id"?: string,"type"?: Database["public"]['Enums']["appointment_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointments_installation_id_fkey"
      columns: ["installation_id"]
isOneToOne: false
      referencedRelation: "installations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_slot_id_fkey"
      columns: ["slot_id"]
isOneToOne: false
      referencedRelation: "appointment_slots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_technician_id_fkey"
      columns: ["technician_id"]
isOneToOne: false
      referencedRelation: "technicians"
      referencedColumns: ["id"]
    }
                  ]
                },"b2b_leads": {
                  Row: {
                    "city": string,"company": string,"contact_name": string,"created_at": string,"id": string,"message": string | null,"phone": string,"sector": string,"status": Database["public"]['Enums']["lead_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "city": string,"company": string,"contact_name": string,"created_at"?: string,"id"?: string,"message"?: string | null,"phone": string,"sector"?: string,"status"?: Database["public"]['Enums']["lead_status"]
                  }
                  Update: {
                    "city"?: string,"company"?: string,"contact_name"?: string,"created_at"?: string,"id"?: string,"message"?: string | null,"phone"?: string,"sector"?: string,"status"?: Database["public"]['Enums']["lead_status"]
                  }
                  Relationships: [
                    
                  ]
                },"installations": {
                  Row: {
                    "created_at": string,"filter_due_at": string | null,"id": string,"installed_at": string,"order_id": string,"product_id": string,"profile_id": string,"warranty_until": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"filter_due_at"?: string | null,"id"?: string,"installed_at"?: string,"order_id": string,"product_id": string,"profile_id": string,"warranty_until"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"filter_due_at"?: string | null,"id"?: string,"installed_at"?: string,"order_id"?: string,"product_id"?: string,"profile_id"?: string,"warranty_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "installations_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "installations_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "installations_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "id": string,"order_id": string,"product_id": string,"product_name": string | null,"qty": number,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"order_id": string,"product_id": string,"product_name"?: string | null,"qty": number,"unit_price": number
                  }
                  Update: {
                    "id"?: string,"order_id"?: string,"product_id"?: string,"product_name"?: string | null,"qty"?: number,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "created_at": string,"id": string,"payment_ref": string | null,"profile_id": string,"shipping_address": NonNullable<Json>,"status": Database["public"]['Enums']["order_status"],"total_try": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"payment_ref"?: string | null,"profile_id": string,"shipping_address"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["order_status"],"total_try": number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"payment_ref"?: string | null,"profile_id"?: string,"shipping_address"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["order_status"],"total_try"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "capacity_lpd": number | null,"category": Database["public"]['Enums']["product_category"],"created_at": string,"id": string,"images": (string)[],"is_active": boolean,"name": string,"price_try": number,"slug": string,"specs": NonNullable<Json>,"stages": number | null,"stock": number,"summary": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "capacity_lpd"?: number | null,"category": Database["public"]['Enums']["product_category"],"created_at"?: string,"id"?: string,"images"?: (string)[],"is_active"?: boolean,"name": string,"price_try": number,"slug": string,"specs"?: NonNullable<Json>,"stages"?: number | null,"stock"?: number,"summary"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "capacity_lpd"?: number | null,"category"?: Database["public"]['Enums']["product_category"],"created_at"?: string,"id"?: string,"images"?: (string)[],"is_active"?: boolean,"name"?: string,"price_try"?: number,"slug"?: string,"specs"?: NonNullable<Json>,"stages"?: number | null,"stock"?: number,"summary"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"id": string,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"id": string,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"regions": {
                  Row: {
                    "active_customers": number,"avg_install_hours": number,"id": string,"map_x": number | null,"map_y": number | null,"name": string,"technician_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active_customers"?: number,"avg_install_hours"?: number,"id"?: string,"map_x"?: number | null,"map_y"?: number | null,"name": string,"technician_count"?: number
                  }
                  Update: {
                    "active_customers"?: number,"avg_install_hours"?: number,"id"?: string,"map_x"?: number | null,"map_y"?: number | null,"name"?: string,"technician_count"?: number
                  }
                  Relationships: [
                    
                  ]
                },"reviews": {
                  Row: {
                    "author_name": string,"city": string | null,"created_at": string,"id": string,"is_approved": boolean,"product_id": string | null,"profile_id": string | null,"rating": number,"text": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name": string,"city"?: string | null,"created_at"?: string,"id"?: string,"is_approved"?: boolean,"product_id"?: string | null,"profile_id"?: string | null,"rating": number,"text": string
                  }
                  Update: {
                    "author_name"?: string,"city"?: string | null,"created_at"?: string,"id"?: string,"is_approved"?: boolean,"product_id"?: string | null,"profile_id"?: string | null,"rating"?: number,"text"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"stock_movements": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"delta": number,"id": string,"note": string | null,"order_id": string | null,"product_id": string,"reason": Database["public"]['Enums']["stock_reason"],"stock_after": number
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"delta": number,"id"?: string,"note"?: string | null,"order_id"?: string | null,"product_id": string,"reason": Database["public"]['Enums']["stock_reason"],"stock_after": number
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"delta"?: number,"id"?: string,"note"?: string | null,"order_id"?: string | null,"product_id"?: string,"reason"?: Database["public"]['Enums']["stock_reason"],"stock_after"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_movements_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "created_at": string,"device_id": string | null,"id": string,"next_billing_at": string | null,"profile_id": string,"provider_ref": string | null,"status": Database["public"]['Enums']["subscription_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"device_id"?: string | null,"id"?: string,"next_billing_at"?: string | null,"profile_id": string,"provider_ref"?: string | null,"status"?: Database["public"]['Enums']["subscription_status"]
                  }
                  Update: {
                    "created_at"?: string,"device_id"?: string | null,"id"?: string,"next_billing_at"?: string | null,"profile_id"?: string,"provider_ref"?: string | null,"status"?: Database["public"]['Enums']["subscription_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_device_id_fkey"
      columns: ["device_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "subscriptions_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"support_tickets": {
                  Row: {
                    "created_at": string,"id": string,"installation_id": string | null,"issue_type": Database["public"]['Enums']["ticket_issue"],"note": string | null,"profile_id": string,"status": Database["public"]['Enums']["ticket_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"installation_id"?: string | null,"issue_type": Database["public"]['Enums']["ticket_issue"],"note"?: string | null,"profile_id": string,"status"?: Database["public"]['Enums']["ticket_status"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"installation_id"?: string | null,"issue_type"?: Database["public"]['Enums']["ticket_issue"],"note"?: string | null,"profile_id"?: string,"status"?: Database["public"]['Enums']["ticket_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "support_tickets_installation_id_fkey"
      columns: ["installation_id"]
isOneToOne: false
      referencedRelation: "installations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "support_tickets_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"technicians": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"is_active": boolean,"phone": string | null,"region_id": string | null,"telegram_chat_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name": string,"id"?: string,"is_active"?: boolean,"phone"?: string | null,"region_id"?: string | null,"telegram_chat_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"is_active"?: boolean,"phone"?: string | null,"region_id"?: string | null,"telegram_chat_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "technicians_region_id_fkey"
      columns: ["region_id"]
isOneToOne: false
      referencedRelation: "regions"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "granted_at": string,"granted_by": string | null,"profile_id": string,"role": Database["public"]['Enums']["app_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"granted_by"?: string | null,"profile_id": string,"role": Database["public"]['Enums']["app_role"]
                  }
                  Update: {
                    "granted_at"?: string,"granted_by"?: string | null,"profile_id"?: string,"role"?: Database["public"]['Enums']["app_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_granted_by_fkey"
      columns: ["granted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_roles_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"water_hardness": {
                  Row: {
                    "hardness_ppm": number,"id": string,"il": string,"ilce": string | null,"level": Database["public"]['Enums']["hardness_level"],"source": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "hardness_ppm": number,"id"?: string,"il": string,"ilce"?: string | null,"level": Database["public"]['Enums']["hardness_level"],"source"?: string | null
                  }
                  Update: {
                    "hardness_ppm"?: number,"id"?: string,"il"?: string,"ilce"?: string | null,"level"?: Database["public"]['Enums']["hardness_level"],"source"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "advance_order_status":
{ Args: { "p_new_status": Database["public"]['Enums']["order_status"],"p_order_id": string }; Returns: undefined
                           },
"book_appointment":
{ Args: { "p_installation_id"?: string,"p_order_id"?: string,"p_slot_id": string,"p_type"?: Database["public"]['Enums']["appointment_type"] }; Returns: string
                           },
"cancel_appointment":
{ Args: { "p_appointment_id": string }; Returns: undefined
                           },
"cancel_order":
{ Args: { "p_order_id": string }; Returns: undefined
                           },
"create_order":
{ Args: { "p_address_id": string,"p_items": Json }; Returns: string
                           },
"hold_appointment_slot":
{ Args: { "p_slot_id": string }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_order_paid":
{ Args: { "p_order_id": string,"p_payment_ref": string }; Returns: undefined
                           },
"moderate_review":
{ Args: { "p_approve": boolean,"p_review_id": string }; Returns: undefined
                           },
"release_expired_slot_holds":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"set_product_active":
{ Args: { "p_is_active": boolean,"p_product_id": string }; Returns: undefined
                           },
"set_product_price":
{ Args: { "p_price_try": number,"p_product_id": string }; Returns: undefined
                           },
"set_product_stock":
{ Args: { "p_new_stock": number,"p_note"?: string,"p_product_id": string }; Returns: number
                           },
"set_subscription_status":
{ Args: { "p_status": Database["public"]['Enums']["subscription_status"],"p_subscription_id": string }; Returns: undefined
                           },
"upsert_product":
{ Args: { "p_category": Database["public"]['Enums']["product_category"],"p_id": string,"p_is_active"?: boolean,"p_name": string,"p_price_try": number,"p_slug": string,"p_summary"?: string }; Returns: string
                           }
          }
          Enums: {
            "app_role": "customer"|"technician"|"b2b"|"admin","appointment_status": "booked"|"completed"|"cancelled","appointment_type": "install"|"filter_change"|"service","hardness_level": "soft"|"medium"|"hard"|"very_hard","lead_status": "new"|"contacted"|"won"|"lost","order_status": "pending"|"paid"|"shipped"|"delivered"|"installed"|"cancelled","product_category": "device"|"filter"|"part","slot_status": "free"|"held"|"booked","stock_reason": "initial"|"manual"|"sale"|"cancel"|"return","subscription_status": "active"|"paused"|"cancelled","ticket_issue": "pressure"|"leak"|"taste"|"other","ticket_status": "open"|"assigned"|"resolved"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"storage": {
          Tables: {
            "bucket_lifecycle_states": {
                  Row: {
                    "bucket_id": string,"claim_id": string | null,"claim_until": string | null,"continuation": Json | null,"failure_count": number,"generation": string | null,"last_completed_at": string | null,"last_error": Json | null,"last_result": Json | null,"last_started_at": string | null,"last_success_at": string | null,"next_run_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_id": string,"claim_id"?: string | null,"claim_until"?: string | null,"continuation"?: Json | null,"failure_count"?: number,"generation"?: string | null,"last_completed_at"?: string | null,"last_error"?: Json | null,"last_result"?: Json | null,"last_started_at"?: string | null,"last_success_at"?: string | null,"next_run_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "bucket_id"?: string,"claim_id"?: string | null,"claim_until"?: string | null,"continuation"?: Json | null,"failure_count"?: number,"generation"?: string | null,"last_completed_at"?: string | null,"last_error"?: Json | null,"last_result"?: Json | null,"last_started_at"?: string | null,"last_success_at"?: string | null,"next_run_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bucket_lifecycle_states_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: true
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"buckets": {
                  Row: {
                    "allowed_mime_types": (string)[] | null,"avif_autodetection": boolean | null,"created_at": string | null,"file_size_limit": number | null,"id": string,"lifecycle_configuration": Json | null,"lifecycle_configuration_generation": string | null,"name": string,"owner": string | null,"owner_id": string | null,"public": boolean | null,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string | null,"versioning_status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allowed_mime_types"?: (string)[] | null,"avif_autodetection"?: boolean | null,"created_at"?: string | null,"file_size_limit"?: number | null,"id": string,"lifecycle_configuration"?: Json | null,"lifecycle_configuration_generation"?: string | null,"name": string,"owner"?: string | null,"owner_id"?: string | null,"public"?: boolean | null,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string | null,"versioning_status"?: string
                  }
                  Update: {
                    "allowed_mime_types"?: (string)[] | null,"avif_autodetection"?: boolean | null,"created_at"?: string | null,"file_size_limit"?: number | null,"id"?: string,"lifecycle_configuration"?: Json | null,"lifecycle_configuration_generation"?: string | null,"name"?: string,"owner"?: string | null,"owner_id"?: string | null,"public"?: boolean | null,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string | null,"versioning_status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"buckets_analytics": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"format": string,"id": string,"name": string,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"format"?: string,"id"?: string,"name": string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"format"?: string,"id"?: string,"name"?: string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"buckets_vectors": {
                  Row: {
                    "created_at": string,"id": string,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"iceberg_namespaces": {
                  Row: {
                    "bucket_name": string,"catalog_id": string,"created_at": string,"id": string,"metadata": NonNullable<Json>,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_name": string,"catalog_id": string,"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "bucket_name"?: string,"catalog_id"?: string,"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
      columns: ["catalog_id"]
isOneToOne: false
      referencedRelation: "buckets_analytics"
      referencedColumns: ["id"]
    }
                  ]
                },"iceberg_tables": {
                  Row: {
                    "bucket_name": string,"catalog_id": string,"created_at": string,"id": string,"location": string,"name": string,"namespace_id": string,"remote_table_id": string | null,"shard_id": string | null,"shard_key": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_name": string,"catalog_id": string,"created_at"?: string,"id"?: string,"location": string,"name": string,"namespace_id": string,"remote_table_id"?: string | null,"shard_id"?: string | null,"shard_key"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "bucket_name"?: string,"catalog_id"?: string,"created_at"?: string,"id"?: string,"location"?: string,"name"?: string,"namespace_id"?: string,"remote_table_id"?: string | null,"shard_id"?: string | null,"shard_key"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "iceberg_tables_catalog_id_fkey"
      columns: ["catalog_id"]
isOneToOne: false
      referencedRelation: "buckets_analytics"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "iceberg_tables_namespace_id_fkey"
      columns: ["namespace_id"]
isOneToOne: false
      referencedRelation: "iceberg_namespaces"
      referencedColumns: ["id"]
    }
                  ]
                },"lifecycle_abandoned_artifacts": {
                  Row: {
                    "attempted_at": string,"bucket_id": string,"key": string,"name": string,"version": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attempted_at"?: string,"bucket_id": string,"key": string,"name": string,"version"?: string | null
                  }
                  Update: {
                    "attempted_at"?: string,"bucket_id"?: string,"key"?: string,"name"?: string,"version"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"migrations": {
                  Row: {
                    "executed_at": string | null,"hash": string,"id": number,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "executed_at"?: string | null,"hash": string,"id": number,"name": string
                  }
                  Update: {
                    "executed_at"?: string | null,"hash"?: string,"id"?: number,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"objects": {
                  Row: {
                    "archived_at": string | null,"bucket_id": string | null,"created_at": string | null,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string | null,"metadata": Json | null,"name": string | null,"owner": string | null,"owner_id": string | null,"path_tokens": (string)[] | null,"updated_at": string | null,"user_metadata": Json | null,"version": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"bucket_id"?: string | null,"created_at"?: string | null,"id"?: string,"is_delete_marker"?: boolean,"is_versioned"?: boolean,"last_accessed_at"?: string | null,"metadata"?: Json | null,"name"?: string | null,"owner"?: string | null,"owner_id"?: string | null,"path_tokens"?: never,"updated_at"?: string | null,"user_metadata"?: Json | null,"version"?: string | null
                  }
                  Update: {
                    "archived_at"?: string | null,"bucket_id"?: string | null,"created_at"?: string | null,"id"?: string,"is_delete_marker"?: boolean,"is_versioned"?: boolean,"last_accessed_at"?: string | null,"metadata"?: Json | null,"name"?: string | null,"owner"?: string | null,"owner_id"?: string | null,"path_tokens"?: never,"updated_at"?: string | null,"user_metadata"?: Json | null,"version"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "objects_bucketId_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"s3_multipart_uploads": {
                  Row: {
                    "bucket_id": string,"created_at": string,"id": string,"in_progress_size": number,"key": string,"metadata": Json | null,"owner_id": string | null,"upload_signature": string,"user_metadata": Json | null,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"id": string,"in_progress_size"?: number,"key": string,"metadata"?: Json | null,"owner_id"?: string | null,"upload_signature": string,"user_metadata"?: Json | null,"version": string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"id"?: string,"in_progress_size"?: number,"key"?: string,"metadata"?: Json | null,"owner_id"?: string | null,"upload_signature"?: string,"user_metadata"?: Json | null,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"s3_multipart_uploads_parts": {
                  Row: {
                    "bucket_id": string,"created_at": string,"etag": string,"id": string,"key": string,"owner_id": string | null,"part_number": number,"size": number,"upload_id": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"etag": string,"id"?: string,"key": string,"owner_id"?: string | null,"part_number": number,"size"?: number,"upload_id": string,"version": string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"etag"?: string,"id"?: string,"key"?: string,"owner_id"?: string | null,"part_number"?: number,"size"?: number,"upload_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
      columns: ["upload_id"]
isOneToOne: false
      referencedRelation: "s3_multipart_uploads"
      referencedColumns: ["id"]
    }
                  ]
                },"vector_indexes": {
                  Row: {
                    "bucket_id": string,"created_at": string,"data_type": string,"dimension": number,"distance_metric": string,"id": string,"metadata_configuration": Json | null,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"data_type": string,"dimension": number,"distance_metric": string,"id"?: string,"metadata_configuration"?: Json | null,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"data_type"?: string,"dimension"?: number,"distance_metric"?: string,"id"?: string,"metadata_configuration"?: Json | null,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vector_indexes_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets_vectors"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "allow_any_operation":
{ Args: { "expected_operations": (string)[] }; Returns: boolean
                           },
"allow_only_operation":
{ Args: { "expected_operation": string }; Returns: boolean
                           },
"can_insert_object":
{ Args: { "bucketid": string,"metadata": Json,"name": string,"owner": string }; Returns: undefined
                           },
"delete_lifecycle_objects":
{ Args: { "object_ids": (string)[] }; Returns: {
              "id": string,"is_delete_marker": boolean,"metadata": Json
            }[]
                           },
"extension":
{ Args: { "name": string }; Returns: string
                           },
"filename":
{ Args: { "name": string }; Returns: string
                           },
"foldername":
{ Args: { "name": string }; Returns: (string)[]
                           },
"get_common_prefix":
{ Args: { "p_delimiter": string,"p_key": string,"p_prefix": string }; Returns: string
                           },
"get_size_by_bucket":
{ Args: { "delete_markers"?: string,"noncurrent_versions"?: string }; Returns: {
              "bucket_id": string,"size": number
            }[]
                           },
"list_multipart_uploads_with_delimiter":
{ Args: { "bucket_id": string,"delimiter_param": string,"max_keys"?: number,"next_key_token"?: string,"next_upload_token"?: string,"prefix_param": string,"raw_prefix_param"?: string }; Returns: {
              "created_at": string,"id": string,"key": string
            }[]
                           },
"list_objects_with_delimiter":
{ Args: { "_bucket_id": string,"delete_markers"?: string,"delimiter_param": string,"max_keys"?: number,"next_token"?: string,"next_token_archived_at"?: string,"next_token_version"?: string,"noncurrent_versions"?: string,"prefix_param": string,"sort_order"?: string,"start_after"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"operation":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"reconcile_lifecycle_state":
{ Args: { "policy_changed": boolean,"target_bucket_id": string }; Returns: undefined
                           },
"search":
{ Args: { "bucketname": string,"delete_markers"?: string,"levels"?: number,"limits"?: number,"noncurrent_versions"?: string,"offsets"?: number,"prefix": string,"search"?: string,"sortcolumn"?: string,"sortorder"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"search_by_timestamp":
{ Args: { "delete_markers"?: string,"noncurrent_versions"?: string,"p_bucket_id": string,"p_level": number,"p_limit": number,"p_prefix": string,"p_sort_column": string,"p_sort_column_after": string,"p_sort_order": string,"p_start_after": string,"p_start_after_version"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"key": string,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"search_v2":
{ Args: { "bucket_name": string,"delete_markers"?: string,"levels"?: number,"limits"?: number,"noncurrent_versions"?: string,"prefix": string,"sort_column"?: string,"sort_column_after"?: string,"sort_order"?: string,"start_after"?: string,"start_after_archived_at"?: string,"start_after_is_continuation"?: boolean,"start_after_version"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"key": string,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           }
          }
          Enums: {
            "buckettype": "STANDARD"|"ANALYTICS"|"VECTOR"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["customer", "technician", "b2b", "admin"],"appointment_status": ["booked", "completed", "cancelled"],"appointment_type": ["install", "filter_change", "service"],"hardness_level": ["soft", "medium", "hard", "very_hard"],"lead_status": ["new", "contacted", "won", "lost"],"order_status": ["pending", "paid", "shipped", "delivered", "installed", "cancelled"],"product_category": ["device", "filter", "part"],"slot_status": ["free", "held", "booked"],"stock_reason": ["initial", "manual", "sale", "cancel", "return"],"subscription_status": ["active", "paused", "cancelled"],"ticket_issue": ["pressure", "leak", "taste", "other"],"ticket_status": ["open", "assigned", "resolved"]
          }
        },"storage": {
          Enums: {
            "buckettype": ["STANDARD", "ANALYTICS", "VECTOR"]
          }
        }
} as const
